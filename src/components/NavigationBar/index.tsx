"use client";

import { FC, Fragment, memo, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { IoMdMenu } from "react-icons/io";
import { RiChat3Line, RiChatHistoryFill } from "react-icons/ri";

import {
  Card,
  Divider,
  Flex,
  IconButton,
  Text,
  useDisclosure,
  useColorMode,
} from "@chakra-ui/react";

import { supabase, GEMINI_MODELS, GEMINI_MODEL } from "@/lib";
import { useAuth, useModel, useToastStore, useAccentColor } from "@/stores";
import type { AccentColors } from "@/theme/types";
import { Button, Menu } from "@/components/ui";
import { SideBar } from "@/components";

interface Thread {
  title?: string;
}

const MODE_STORAGE_KEY = "color-mode-preference";

const NavigationBar: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToastStore();
  const { model, setModel } = useModel();
  const { setColorMode } = useColorMode();
  const { setAccentColor } = useAccentColor();

  const [currentThreadTitle, setCurrentThreadTitle] = useState<string | null>(
    null
  );

  const formatModel = (value: string) =>
    value
      .replace(/^gemini/i, "Gemini")
      .replace(/-/g, " ")
      .replace(/\b(\w)/g, (match) => match.toUpperCase());

  useEffect(() => {
    (async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("model, color_mode, accent_color")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to load preferences:", error);
          setModel(GEMINI_MODEL);
          setColorMode("system");
          setAccentColor("cyan" as AccentColors);
          if (typeof window !== "undefined") {
            localStorage.setItem(MODE_STORAGE_KEY, "system");
          }
          return;
        }

        const defaults: { user_id: string; model?: string; color_mode?: string; accent_color?: AccentColors } = {
          user_id: user.id,
        };
        let needsUpsert = false;

        if (data?.model) {
          setModel(data.model);
        } else {
          setModel(GEMINI_MODEL);
          defaults.model = GEMINI_MODEL;
          needsUpsert = true;
        }

        if (data?.color_mode) {
          const saved = data.color_mode as "light" | "dark" | "system";
          setColorMode(saved);
          if (typeof window !== "undefined") {
            localStorage.setItem(MODE_STORAGE_KEY, saved);
          }
        } else {
          setColorMode("system");
          if (typeof window !== "undefined") {
            localStorage.setItem(MODE_STORAGE_KEY, "system");
          }
          defaults.color_mode = "system";
          needsUpsert = true;
        }

        if (data?.accent_color) {
          setAccentColor(data.accent_color as AccentColors);
        } else {
          setAccentColor("cyan" as AccentColors);
          defaults.accent_color = "cyan" as AccentColors;
          needsUpsert = true;
        }

        if (needsUpsert) {
          await supabase
            .from("user_preferences")
            .upsert(defaults, { onConflict: "user_id" });
        }
      } else {
        setModel(GEMINI_MODEL);
        setColorMode("system");
        setAccentColor("cyan" as AccentColors);
        if (typeof window !== "undefined") {
          localStorage.setItem(MODE_STORAGE_KEY, "system");
        }
      }
    })();
  }, [user, setModel, setColorMode, setAccentColor]);

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
                {pathname === "/"
                  ? "Xeenapz"
                  : pathname === "/thread/temp"
                  ? "Temporary Chat"
                  : currentThreadTitle || "Xeenapz"}
              </Text>
              {user ? (
                <Menu
                  items={GEMINI_MODELS.map((m) => ({
                    value: m,
                    label: formatModel(m),
                  }))}
                  value={model}
                  onChange={async (value) => {
                    if (value) {
                      setModel(value);
                      if (user) {
                        const { error } = await supabase
                          .from("user_preferences")
                          .upsert(
                            { user_id: user.id, model: value },
                            { onConflict: "user_id" }
                          );
                        if (error) {
                          console.error("Failed to save model:", error);
                        }
                      }
                    }
                  }}
                  placeholder="Select Model"
                  includeNullOption={false}
                  buttonProps={{
                    size: "xs",
                    variant: "ghost",
                    color: "secondaryText",
                    px: 1,
                    w: "auto",
                  }}
                />
              ) : (
                <Text
                  color="secondaryText"
                  fontSize="xs"
                  pl={1}
                  fontWeight="semibold"
                >
                  {formatModel(GEMINI_MODEL)}
                </Text>
              )}
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
