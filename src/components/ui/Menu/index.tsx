"use client";

import { useRef } from "react";
import {
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  type MenuProps as ChakraMenuProps,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import Button from "../Button";
import MenuList from "../MenuList";
import MenuItem from "../MenuItem";

interface MenuItemData {
  label: string;
  value: string;
}

interface MenuProps extends Omit<ChakraMenuProps, "children"> {
  items: MenuItemData[];
  value: string | null;
  onChange: (value: string | null) => void | Promise<void>;
  placeholder?: string;
  buttonProps?: ButtonProps;
}

const Menu = ({
  items,
  value,
  onChange,
  placeholder = "Select...",
  buttonProps,
  ...props
}: MenuProps) => {
  const selectedRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    items.find((i) => i.value === value)?.label ?? placeholder;

  return (
    <ChakraMenu initialFocusRef={selectedRef} {...props}>
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
        <MenuItem
          ref={value === null ? selectedRef : undefined}
          onClick={() => onChange(null)}
          color={value === null ? "red.500" : undefined}
        >
          {placeholder}
        </MenuItem>
        {items.map((item) => (
          <MenuItem
            key={item.value}
            ref={item.value === value ? selectedRef : undefined}
            onClick={() => onChange(item.value)}
            color={item.value === value ? "red.500" : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </ChakraMenu>
  );
};

export default Menu;

