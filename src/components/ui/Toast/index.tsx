"use client";

import { useEffect } from "react";
import { useToastStore } from "@/stores/toastStore";
import {
  Box,
  Flex,
  Icon,
  Text,
  IconButton,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  InfoIcon,
  WarningIcon,
  CheckCircleIcon,
  WarningTwoIcon,
  CloseIcon,
} from "@chakra-ui/icons";

const Toast = () => {
  const { toast, clearToast } = useToastStore();
  const chakraToast = useToast();

  useEffect(() => {
    if (toast) {
      chakraToast({
        duration: toast.duration || 5000,
        position: "bottom-left",
        isClosable: true,
        render: ({ onClose }) => {
          const IconComponent = getIcon(toast.status || "info");
          const iconColor = getIconColor(toast.status || "info");

          return (
            <Flex
              bg="contrastBackground"
              color="contrastText"
              borderRadius="md"
              p={3}
              boxShadow="md"
              align="flex-start"
              justify="space-between"
              gap={3}
              minW="300px"
              maxW="350px"
            >
              <Icon as={IconComponent} boxSize={5} mt={0.5} color={iconColor} />
              <Box flex="1">
                <Text>{toast.title}</Text>
                {toast.description && (
                  <Text fontSize="sm" mt={1}>
                    {toast.description}
                  </Text>
                )}
              </Box>
              <IconButton
                aria-label="Close"
                color="gray"
                size="xs"
                variant="ghost"
                icon={<CloseIcon boxSize={3} />}
                onClick={onClose}
                _hover={{ bgColor: "transparent" }}
                _active={{ bgColor: "transparent" }}
                _focus={{ bgColor: "transparent" }}
              />
            </Flex>
          );
        },
      });

      clearToast();
    }
  }, [toast, chakraToast, clearToast]);

  return null;
};

const getIcon = (status: string) => {
  switch (status) {
    case "success":
      return CheckCircleIcon;
    case "error":
      return WarningTwoIcon;
    case "warning":
      return WarningIcon;
    case "info":
    default:
      return InfoIcon;
  }
};

const getIconColor = (status: string) => {
  switch (status) {
    case "success":
      return useColorModeValue("green.300", "green.500");
    case "error":
      return useColorModeValue("red.300", "red.500");
    case "warning":
      return useColorModeValue("yellow.300", "yellow.500");
    case "info":
    default:
      return useColorModeValue("blue.300", "blue.500");
  }
};

export default Toast;
