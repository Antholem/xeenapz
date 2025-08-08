"use client";

import { FC } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Switch,
  useColorMode,
} from "@chakra-ui/react";

interface SettingsProps {
  type: "persistent" | "temporary";
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ type, isOpen, onClose }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const content = (
    <FormControl display="flex" alignItems="center">
      <FormLabel htmlFor="dark-mode" mb="0">
        Enable dark mode
      </FormLabel>
      <Switch
        id="dark-mode"
        isChecked={colorMode === "dark"}
        onChange={toggleColorMode}
      />
    </FormControl>
  );

  return type === "persistent" ? (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{content}</ModalBody>
      </ModalContent>
    </Modal>
  ) : (
    <Drawer isOpen={isOpen} onClose={onClose} size="full" placement="left">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Settings</DrawerHeader>
        <DrawerBody>{content}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default Settings;

