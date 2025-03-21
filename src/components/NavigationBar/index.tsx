"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Flex,
  Text,
  Button,
  Avatar,
  useColorMode,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Divider,
  useDisclosure,
  useBreakpointValue,
  Card,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { FiLogOut, FiUserCheck } from "react-icons/fi";
import { IoMdMenu } from "react-icons/io";
import SideBar from "@/components/SideBar";

const NavigationBar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [user, setUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
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
        <Card
            as="nav"
            width="100%"
            zIndex="50"
            borderRadius={0}
            variant="unstyled"
        >
        <Flex py="3" px="6" align="center" justify="space-between">
            <Flex align="center" gap={3}>
                {!isLargeScreen && (
                    <IconButton
                    aria-label="Toggle Sidebar"
                    icon={<IoMdMenu />}
                    variant="ghost"
                    onClick={onOpen}
                    />
                )}
                <Text fontSize="lg" fontWeight="bold">Xeenapz</Text>
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
                        src={user.photoURL ?? "/default-avatar.png"} 
                        name={user.displayName ?? "User"} 
                        cursor="pointer"
                    />
                    <MenuList>
                        <MenuItem onClick={handleGoogleSignIn} icon={<Icon as={FiUserCheck} />}>
                        Switch Account
                        </MenuItem>
                        <MenuItem onClick={handleSignOut} icon={<Icon as={FiLogOut} />}>
                        Log out
                        </MenuItem>
                    </MenuList>
                </Menu>
            ) : (
                <Button onClick={handleGoogleSignIn}>Login</Button>
            )}
            </Flex>
        </Flex>
        </Card>
        
        <Divider orientation="horizontal" />

        {/* Sidebar for smaller screens */}
        <SideBar type="temporary" isOpen={isOpen} placement="left" onClose={onClose} />
    </Fragment>
  );
};

export default NavigationBar;
