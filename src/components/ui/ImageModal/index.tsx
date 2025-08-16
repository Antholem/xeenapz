"use client";

import { FC, useEffect } from "react";
import { Box, Image, CloseButton, Fade, ScaleFade, Portal } from "@chakra-ui/react";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: FC<ImageModalProps> = ({ src, alt, isOpen, onClose }) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;

    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isOpen]);

  return (
    <Portal>
      <Fade in={isOpen} unmountOnExit>
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
          <ScaleFade in={isOpen} initialScale={0.9}>
            <Image src={src} alt={alt} w="100%" maxH="80vh" objectFit="contain" />
          </ScaleFade>
        </Box>
      </Fade>
    </Portal>
  );
};

export default ImageModal;

