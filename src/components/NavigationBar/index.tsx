"use client";

import { FC, Fragment, memo, useEffect, useRef, useState } from "react";
import {
  Flex,
  Text,
  Button,
  useColorMode,
  IconButton,
  Divider,
  useDisclosure,
  Card,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { HiPencilAlt } from "react-icons/hi";
import {
  auth,
  provider,
  db,
  doc,
  onSnapshot,
  Unsubscribe,
  signInWithPopup,
} from "@/lib/firebase";
import { IoMdMenu } from "react-icons/io";
import SideBar from "@/components/SideBar";
import { usePathname } from "next/navigation";
import { RiChat3Line, RiChatHistoryLine } from "react-icons/ri";
import useTempChat from "@/stores/useTempChat";
import useAuth from "@/stores/useAuth";

interface Conversation {
  title?: string;
}

const NavigationBar: FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, loading: authLoading } = useAuth();
  const { isMessageTemporary, setIsMessageTemporary } = useTempChat();
  const pathname = usePathname();
  const [currentConvoTitle, setCurrentConvoTitle] = useState<string | null>(
    null
  );
  const unsubscribeRef = useRef<Unsubscribe | undefined>(undefined);

  useEffect(() => {
    const fetchConvoTitle = async () => {
      if (pathname?.startsWith("/chat/") && user) {
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
      } else {
        setCurrentConvoTitle(null);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = undefined;
        }
      }
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
    setIsMessageTemporary(!isMessageTemporary);
  };

  if (authLoading) return null;

  return (
    <Fragment>
      <Card
        as="nav"
        width="100%"
        zIndex="50"
        borderRadius={0}
        variant="unstyled"
      >
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
            {user && pathname === "/" && (
              <IconButton
                aria-label="Temporary Chat"
                icon={
                  isMessageTemporary ? <RiChatHistoryLine /> : <RiChat3Line />
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
