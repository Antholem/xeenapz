"use client";

import { FC, useEffect } from "react";
import { Box, Image, CloseButton } from "@chakra-ui/react";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: FC<ImageModalProps> = ({ src, alt, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      bgColor="background"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="modal"
    >
      <CloseButton
        position="fixed"
        top={4}
        right={4}
        borderRadius="full"
        color="primaryText"
        onClick={onClose}
      />
      <Image src={src} alt={alt} w="100%" maxH="80vh" objectFit="contain" />
    </Box>
  );
};

export default ImageModal;

