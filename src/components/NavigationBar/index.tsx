"use client";

import { useState, useEffect } from "react";
import {
    Flex,
    Box,
    Text,
    Button,
    Avatar,
    useColorMode,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

const NavigationBar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const [user, setUser] = useState<User | null>(null);

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
        <Box
            as="nav"
            position="fixed"
            top="0"
            left="0"
            width="100%"
            zIndex="50"
            borderBottom="1px solid"
            borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
        >
            <Flex mx="auto" py="3" px="6" align="center" justify="space-between">
                <Flex align="center" gap={3}>
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
                            <MenuButton as={Avatar} size="sm" src={user.photoURL || ""} name={user.displayName || "User"} cursor="pointer" />
                            <MenuList>
                                <MenuItem onClick={handleSignOut}>
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
        </Box>
    );
};

export default NavigationBar;
