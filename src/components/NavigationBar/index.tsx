"use client";

import { FC, Fragment, memo, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiPencilAlt } from "react-icons/hi";
import { IoMdMenu } from "react-icons/io";
import { RiChat3Line, RiChatHistoryFill } from "react-icons/ri";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Flex,
  Text,
  useColorMode,
  IconButton,
  Divider,
  useDisclosure,
  Card,
} from "@chakra-ui/react";
import {
  auth,
  provider,
  db,
  doc,
  onSnapshot,
  Unsubscribe,
  signInWithPopup,
} from "@/lib/firebase";
import useAuth from "@/stores/useAuth";
import { SideBar } from "@/components";
import { Button } from "@/components/UI";

interface Conversation {
  title?: string;
}

const NavigationBar: FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [currentConvoTitle, setCurrentConvoTitle] = useState<string | null>(
    null
  );
  const unsubscribeRef = useRef<Unsubscribe | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const fetchConvoTitle = async () => {
      if (
        !user ||
        pathname === "/chat/temp" ||
        !pathname?.startsWith("/chat/")
      ) {
        setCurrentConvoTitle(null);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = undefined;
        }
        return;
      }

      const convoId = pathname.split("/")[2];
      const docRef = doc(db, "conversations", convoId);

      unsubscribeRef.current = onSnapshot(
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
    };

    fetchConvoTitle();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
      }
    };
  }, [pathname, user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth!, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const toggleTemporaryChat = () => {
    if (pathname === "/") {
      router.push("/chat/temp");
    } else {
      router.push("/");
    }
  };

  if (authLoading) return null;

  return (
    <Fragment>
      <Card as="nav" width="100%" zIndex="50" borderRadius={0}>
        <Flex py="3" px="6" align="center" justify="space-between" gap={2}>
          <Flex align="center" gap={3} display={{ base: "block", lg: "none" }}>
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
          </Flex>
          <Flex align="center" gap={3}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              textAlign="center"
              noOfLines={1}
            >
              {pathname === "/" ? "Xeenapz" : currentConvoTitle || "Xeenapz"}
            </Text>
          </Flex>
          <Flex align="center" gap={4}>
            {user && (pathname === "/" || pathname === "/chat/temp") && (
              <IconButton
                aria-label="Temporary Chat"
                icon={
                  pathname === "/" ? <RiChat3Line /> : <RiChatHistoryFill />
                }
                variant="ghost"
                onClick={toggleTemporaryChat}
              />
            )}
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

      <SideBar
        type="temporary"
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
      />
    </Fragment>
  );
};

export default memo(NavigationBar);
