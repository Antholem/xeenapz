"use client";

import {
  FC,
  useRef,
  useState,
  type WheelEventHandler,
  type KeyboardEventHandler,
  type PointerEventHandler,
} from "react";
import {
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalBody,
  type ModalProps,
  Image,
  Box,
} from "@chakra-ui/react";
import ModalContent from "../ModalContent";

interface ImageModalProps extends Omit<ModalProps, "children"> {
  src: string;
  alt: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const ImageModal: FC<ImageModalProps> = ({ src, alt, ...props }) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const startDistance = useRef<number | null>(null);
  const startScale = useRef(1);

  const handleWheel: WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setScale((s) => clamp(s - e.deltaY * 0.001, 1, 5));
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "+" || e.key === "=") {
      setScale((s) => clamp(s + 0.1, 1, 5));
    }
    if (e.key === "-" || e.key === "_") {
      setScale((s) => clamp(s - 0.1, 1, 5));
    }
    if (e.key === "0") {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) {
      lastPos.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      startDistance.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      startScale.current = scale;
    }
  };

  const handlePointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1 && scale > 1 && lastPos.current) {
      const current = pointers.current.get(e.pointerId)!;
      const dx = current.x - lastPos.current.x;
      const dy = current.y - lastPos.current.y;
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      lastPos.current = current;
    } else if (pointers.current.size === 2 && startDistance.current) {
      const [p1, p2] = Array.from(pointers.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const newScale = (dist / startDistance.current) * startScale.current;
      setScale(clamp(newScale, 1, 5));
    }
  };

  const endPointer = (id: number) => {
    pointers.current.delete(id);
    if (pointers.current.size < 2) startDistance.current = null;
    if (pointers.current.size === 0) lastPos.current = null;
  };

  const handlePointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    endPointer(e.pointerId);
  };

  const handlePointerCancel: PointerEventHandler<HTMLDivElement> = (e) => {
    endPointer(e.pointerId);
  };

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
          <Box
            tabIndex={0}
            outline="none"
            overflow="hidden"
            style={{ touchAction: "none" }}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            cursor={scale > 1 ? "grab" : "auto"}
          >
            <Image
              src={src}
              alt={alt}
              w="100%"
              maxH="80vh"
              objectFit="contain"
              transform={`translate(${translate.x}px, ${translate.y}px) scale(${scale})`}
              transformOrigin="center"
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
