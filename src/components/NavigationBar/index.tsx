"use client";

import { FC, Fragment, memo, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { IoAdd } from "react-icons/io5";
import { IoMdMenu } from "react-icons/io";
import {
  RiChat3Line,
  RiChatHistoryFill,
  RiMoonFill,
  RiSunFill,
} from "react-icons/ri";

import {
  Card,
  Divider,
  Flex,
  IconButton,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";

import { useAuth } from "@/stores";
import { SideBar } from "@/components";
import { Button } from "@themed-components";
import { useToastStore } from "@/stores";
import { supabase } from "@/lib/supabaseClient";

interface Thread {
  title?: string;
}

const NavigationBar: FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToastStore();

  const [currentThreadTitle, setCurrentThreadTitle] = useState<string | null>(
    null
  );
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchThreadTitle = async () => {
      if (
        !user ||
        pathname === "/thread/temp" ||
        !pathname?.startsWith("/thread/")
      ) {
        setCurrentThreadTitle(null);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      const threadId = pathname.split("/")[2];

      const loadTitle = async () => {
        const { data, error } = await supabase
          .from("threads")
          .select("title")
          .eq("id", threadId)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          console.error("Error fetching thread title:", error);
          setCurrentThreadTitle(null);
          return;
        }

        setCurrentThreadTitle(data.title || null);
      };

      await loadTitle();

      // Optional: emulate realtime via polling (every 10s)
      pollingRef.current = setInterval(loadTitle, 10000);
    };

    fetchThreadTitle();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [pathname, user]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) throw error;

      showToast({
        id: `login-${Date.now()}`,
        title: `Redirecting to sign in...`,
        status: "success",
      });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      showToast({
        id: `login-error-${Date.now()}`,
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        status: "error",
      });
    }
  };

  const toggleTemporaryChat = () => {
    if (pathname === "/") {
      router.push("/thread/temp");
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
                icon={<IoAdd />}
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
              {pathname === "/" ? "Xeenapz" : currentThreadTitle || "Xeenapz"}
            </Text>
          </Flex>

          <Flex align="center" gap={4}>
            {user && (pathname === "/" || pathname === "/thread/temp") && (
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
              icon={colorMode === "light" ? <RiMoonFill /> : <RiSunFill />}
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
