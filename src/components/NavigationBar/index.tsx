"use client";

import { Fragment } from "react";
import {
  Flex,
  Text,
  Button,
  useColorMode,
  IconButton,
  Divider,
  useDisclosure,
  useBreakpointValue,
  Card,
  Skeleton,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { HiPencilAlt } from "react-icons/hi";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { IoMdMenu } from "react-icons/io";
import SideBar from "@/components/SideBar";
import { useAuth } from "@/app/context/Auth";

const NavigationBar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });
  const { user, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
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
          {loading ? (
            <Skeleton height="40px" width="100%" borderRadius="md" />
          ) : isLargeScreen ? (
            <Fragment>
              <Flex align="center" gap={3}>
                <Text fontSize="lg" fontWeight="bold" isTruncated>
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
                {!user && <Button onClick={handleGoogleSignIn}>Login</Button>}
              </Flex>
            </Fragment>
          ) : (
            <Fragment>
              {user ? (
                <IconButton
                  aria-label="Toggle Sidebar"
                  icon={<IoMdMenu />}
                  variant="ghost"
                  onClick={onOpen}
                />
              ) : (
                <IconButton
                  aria-label="New Chat"
                  icon={<HiPencilAlt />}
                  variant="ghost"
                />
              )}
              <Text fontSize="lg" fontWeight="bold" isTruncated>
                Xeenapz
              </Text>
              <Flex align="center" gap={2}>
                <IconButton
                  aria-label="Toggle Dark Mode"
                  icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                  variant="ghost"
                />
                {!user && (
                  <Button size="sm" onClick={handleGoogleSignIn}>
                    Login
                  </Button>
                )}
              </Flex>
            </Fragment>
          )}
        </Flex>
      </Card>

      <Divider orientation="horizontal" />

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
