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
      size="xl"
      motionPreset="none"
      closeOnOverlayClick={false}
      {...props}
    >
      <ModalOverlay bgColor="background" />
      <ModalContent>
        <ModalCloseButton
          position="fixed"
          top={4}
          right={4}
          borderRadius="full"
          color="primaryText"
        />
        <ModalBody p={0}>
          <Image src={src} alt={alt} w="100%" maxH="80vh" objectFit="contain" />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
