"use client";

import { useState, useEffect, Fragment } from "react";
import {
    Flex,
    Box,
    Text,
    Button,
    Avatar,
    useColorMode,
    useTheme,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    Divider,
    useDisclosure,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { FiLogOut } from "react-icons/fi";
import { IoMdMenu } from "react-icons/io";
import SideBar from "@/components/SideBar";

const NavigationBar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const theme = useTheme();
    const bgColor = theme.styles.global({ colorMode }).body.bg;
    const [user, setUser] = useState<User | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign-Out Error:", error);
        }
    };

    return (
        <Fragment>
            <Box as="nav" width="100%" zIndex="50" bg={bgColor}>
                <Flex mx="auto" py="3" px="6" align="center" justify="space-between">
                    <Flex align="center" gap={3}>
                        <IconButton
                            aria-label="Toggle Sidebar"
                            icon={<IoMdMenu />}
                            variant="ghost"
                            onClick={onOpen}
                        />
                        <Text fontSize="lg" fontWeight="bold">
                            Xeenapz
                        </Text>
                    </Flex>

                    <Flex align="center" gap={4}>
                        <IconButton
                            aria-label="Toggle Dark Mode"
                            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                            onClick={toggleColorMode}
                            variant="ghost"
                        />
                        {user ? (
                            <Menu>
                                <MenuButton 
                                    as={Avatar} 
                                    size="sm" 
                                    src={user?.photoURL ?? "/default-avatar.png"} 
                                    name={user?.displayName ?? "User"} 
                                    cursor="pointer" 
                                />
                                <MenuList>
                                    <MenuItem onClick={handleSignOut} icon={<Icon as={FiLogOut} />}>
                                        Log Out
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        ) : (
                            <Button onClick={handleGoogleSignIn}>
                                Login with Google
                            </Button>
                        )}
                    </Flex>
                </Flex>
                <Divider orientation="horizontal" />
            </Box>

            <SideBar 
                type="temporary"
                isOpen={isOpen} 
                placement="left" 
                onClose={onClose}
            />
        </Fragment>
    );
};

export default NavigationBar;
