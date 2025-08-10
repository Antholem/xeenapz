"use client";

import { FC, Fragment, memo, useEffect, useState } from "react";
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
  Menu,
  MenuButton,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";

import { supabase, GEMINI_MODELS } from "@/lib";
import { useAuth, useModel, useToastStore } from "@/stores";
import { Button, MenuItem, MenuList } from "@themed-components";
import { SideBar } from "@/components";

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
  const { model, setModel } = useModel();

  const [currentThreadTitle, setCurrentThreadTitle] = useState<string | null>(
    null
  );

  const formatModel = (value: string) =>
    value
      .replace(/^gemini/i, "Gemini")
      .replace(/-/g, " ")
      .replace(/\b(\w)/g, (match) => match.toUpperCase());

  const formattedModel = formatModel(model);

  useEffect(() => {
    const fetchThreadTitle = async () => {
      if (
        !user ||
        pathname === "/thread/temp" ||
        !pathname?.startsWith("/thread/")
      ) {
        setCurrentThreadTitle(null);
        return;
      }

      const threadId = pathname.split("/")[2];
      const { data, error } = await supabase
        .from("threads")
        .select("title")
        .eq("id", threadId)
        .single();

      if (error) {
        console.error("Error fetching thread title:", error.message);
        setCurrentThreadTitle(null);
      } else {
        setCurrentThreadTitle(data?.title ?? null);
      }

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`realtime:threads:id=eq.${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "threads",
            filter: `id=eq.${threadId}`,
          },
          (payload) => {
            const updated = payload.new as Thread;
            setCurrentThreadTitle(updated?.title || null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchThreadTitle();
  }, [pathname, user]);

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: "google" });
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
          <Flex align="center" gap={3} flex="1" minW={0}>
            <Flex align="center" display={{ base: "flex", lg: "none" }}>
              {user && (
                <IconButton
                  aria-label="Toggle Sidebar"
                  icon={<IoMdMenu />}
                  variant="ghost"
                  onClick={onOpen}
                />
              )}
            </Flex>

            <Flex align="start" direction="column" flex="1" minW={0}>
              <Text fontSize="lg" fontWeight="bold" noOfLines={1} px={1}>
                {pathname === "/" ? "Xeenapz" : pathname === "/thread/temp" ? "Temporary Chat" : currentThreadTitle || "Xeenapz"}
              </Text>
              <Menu>
                <MenuButton
                  as={Button}
                  size="xs"
                  variant="ghost"
                  color="secondaryText"
                  colorScheme="gray"
                  px={1}
                  maxW="100%"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {formattedModel}
                </MenuButton>
                <MenuList>
                  {GEMINI_MODELS.map((m) => (
                    <MenuItem key={m} onClick={() => setModel(m)}>
                      {formatModel(m)}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>
          </Flex>

          <Flex align="center" gap={4} flexShrink={0}>
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
