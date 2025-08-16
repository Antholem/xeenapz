"use client";

import { FC } from "react";
import {
  Menu,
  MenuButton,
  useColorMode,
  type MenuProps,
} from "@chakra-ui/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import Button from "../Button";
import MenuItem from "../MenuItem";
import MenuList from "../MenuList";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends Omit<MenuProps, "children"> {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

const Select: FC<SelectProps> = ({ value, options, onChange, ...menuProps }) => {
  const { colorMode } = useColorMode();
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const selectedBg = colorMode === "dark" ? "gray.700" : "gray.100";

  return (
    <Menu {...menuProps}>
      <MenuButton as={Button} rightIcon={<HiOutlineChevronDown />} variant="outline">
        {selectedLabel}
      </MenuButton>
      <MenuList>
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            bgColor={value === opt.value ? selectedBg : undefined}
          >
            {opt.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default Select;

