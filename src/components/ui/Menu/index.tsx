"use client";

import { useRef } from "react";
import {
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  type MenuProps as ChakraMenuProps,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
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
      <ChakraMenuButton as={Button} w="full" textAlign="left" {...buttonProps}>
        {selectedLabel}
      </ChakraMenuButton>
      <MenuList maxH="200px" overflowY="auto">
        <MenuItem
          ref={value === null ? selectedRef : undefined}
          onClick={() => onChange(null)}
        >
          {placeholder}
        </MenuItem>
        {items.map((item) => (
          <MenuItem
            key={item.value}
            ref={item.value === value ? selectedRef : undefined}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </ChakraMenu>
  );
};

export default Menu;

