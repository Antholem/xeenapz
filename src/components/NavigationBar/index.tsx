"use client";

import { useState, useEffect } from "react";
import { Flex, Box, Text, Button, Avatar, useColorMode, IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

const NavigationBar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const [user, setUser] = useState<User | null>(null);

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    // Google Sign-In
    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };

    // Sign out user
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
            bg={colorMode === "light" ? "white" : "gray.900"}
            boxShadow="md"
            zIndex="50"
        >
            <Flex mx="auto" py="3" px="6" align="center" justify="space-between">
                <Flex align="center" gap={3}>
                    <Avatar size="sm" src="/favicon.ico" />
                    <Text fontSize="lg" fontWeight="bold" color={colorMode === "light" ? "gray.800" : "white"}>
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
                        <Avatar
                            size="sm"
                            src={user.photoURL || ""}
                            name={user.displayName || "User"}
                            cursor="pointer"
                            onClick={handleSignOut}
                        />
                    ) : (
                        <Button onClick={handleGoogleSignIn}>Login with Google</Button>
                    )}
                </Flex>
            </Flex>
        </Box>
    );
};

export default NavigationBar;
