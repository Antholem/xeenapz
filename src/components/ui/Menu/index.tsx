"use client";

import { useRef } from "react";
import {
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  type MenuProps as ChakraMenuProps,
  useColorMode,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import Button from "../Button";
import MenuList from "../MenuList";
import MenuItem from "../MenuItem";
import { useAccentColor } from "@/stores";

interface MenuItemData {
  label: string;
  value: string;
}

interface MenuProps extends Omit<ChakraMenuProps, "children"> {
  items: MenuItemData[];
  value: string | null;
  onChange: (value: string | null) => void | Promise<void>;
  placeholder?: string;
  includeNullOption?: boolean;
  buttonProps?: ButtonProps;
}

const Menu = ({
  items,
  value,
  onChange,
  placeholder = "Select...",
  includeNullOption = true,
  buttonProps,
  ...props
}: MenuProps) => {
  const selectedRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    items.find((i) => i.value === value)?.label ?? placeholder;
  const { colorMode } = useColorMode();
  const { accentColor } = useAccentColor();
  const selectedColor =
    colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.500`;

  return (
    <ChakraMenu matchWidth initialFocusRef={selectedRef} {...props}>
      <ChakraMenuButton
        as={Button}
        colorScheme="gray"
        w="full"
        variant="solid"
        textAlign="left"
        rightIcon={<HiOutlineChevronDown />}
        {...buttonProps}
      >
        {selectedLabel}
      </ChakraMenuButton>
      <MenuList maxH="200px" overflowY="auto">
        {includeNullOption && (
          <MenuItem
            ref={value === null ? selectedRef : undefined}
            onClick={() => onChange(null)}
            color={value === null ? selectedColor : undefined}
            w="full"
          >
            {placeholder}
          </MenuItem>
        )}
        {items.map((item) => (
          <MenuItem
            key={item.value}
            ref={item.value === value ? selectedRef : undefined}
            onClick={() => onChange(item.value)}
            color={item.value === value ? selectedColor : undefined}
            w="full"
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </ChakraMenu>
  );
};

export default Menu;

