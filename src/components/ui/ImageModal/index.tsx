"use client";

import { FC } from "react";
import {
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalBody,
  type ModalProps,
  Image,
} from "@chakra-ui/react";
import ModalContent from "../ModalContent";

interface ImageModalProps extends Omit<ModalProps, "children"> {
  src: string;
  alt: string;
}

const ImageModal: FC<ImageModalProps> = ({ src, alt, ...props }) => {
  return (
    <Modal
      isCentered
      size="full"
      closeOnOverlayClick={false}
      {...props}
    >
      <ModalOverlay />
      <ModalContent h="full" bgColor="background">
        <ModalCloseButton
          position="fixed"
          top={4}
          right={4}
          borderRadius="full"
          color="primaryText"
        />
        <ModalBody
          p={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            src={src}
            alt={alt}
            maxW="100%"
            maxH="70vh"
            objectFit="contain"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
