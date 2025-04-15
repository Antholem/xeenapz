"use client";

import { FC, Fragment, useEffect, useState } from "react";
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
import { auth, provider, db, doc, onSnapshot } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { IoMdMenu } from "react-icons/io";
import SideBar from "@/components/SideBar";
import { useAuth } from "@/app/context/Auth";
import { usePathname } from "next/navigation";
import { Unsubscribe } from "firebase/firestore";

interface Conversation {
  title?: string;
}

const NavigationBar: FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [currentConvoTitle, setCurrentConvoTitle] = useState<string | null>(
    null
  );
  let unsubscribe: Unsubscribe | undefined;

  useEffect(() => {
    const fetchConvoTitle = async () => {
      if (pathname?.startsWith("/chat/") && user) {
        const convoId = pathname.split("/")[2];
        const docRef = doc(db, "conversations", convoId);

        unsubscribe = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Conversation;
              setCurrentConvoTitle(data.title || null);
            } else {
              setCurrentConvoTitle(null);
            }
          },
          (error) => {
            console.error("Error listening for conversation updates:", error);
            setCurrentConvoTitle(null);
          }
        );
      } else {
        setCurrentConvoTitle(null);
        // Unsubscribe from any previous listener when not on a chat route
        if (unsubscribe) {
          unsubscribe();
        }
      }
    };

    fetchConvoTitle();

    // Clean up the listener when the component unmounts or dependencies change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pathname, user]);

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
          {authLoading ? (
            <Skeleton height="40px" width="100%" borderRadius="md" />
          ) : isLargeScreen ? (
            <Fragment>
              <Flex align="center" gap={3}>
                <Text fontSize="lg" fontWeight="bold" isTruncated>
                  {pathname === "/"
                    ? "Xeenapz"
                    : currentConvoTitle || "Xeenapz"}
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
                {pathname === "/" ? "Xeenapz" : currentConvoTitle || "Xeenapz"}
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
