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
  Progress,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
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

  if (loading) return <Progress size="xs" isIndeterminate />;

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
            {user && !isLargeScreen && (
              <IconButton
                aria-label="Toggle Sidebar"
                icon={<IoMdMenu />}
                variant="ghost"
                onClick={onOpen}
              />
            )}
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
            {!user && <Button onClick={handleGoogleSignIn}>Login</Button>}
          </Flex>
        </Flex>
      </Card>

      <Divider orientation="horizontal" />

      {/* Sidebar for smaller screens */}
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
