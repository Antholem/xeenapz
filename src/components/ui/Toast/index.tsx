"use client";

import { useToast } from "@chakra-ui/react";
import { useEffect } from "react";
import { useToastStore } from "@/stores/toastStore";

const Toast = () => {
  const { toast, clearToast } = useToastStore();
  const chakraToast = useToast();

  useEffect(() => {
    if (toast) {
      chakraToast({
        title: toast.title,
        description: toast.description,
        status: toast.status,
        duration: toast.duration || 50000,
        isClosable: true,
        position: "bottom-left",
        variant: "subtle",
      });

      clearToast();
    }
  }, [toast, chakraToast, clearToast]);

  return null;
};

export default Toast;
