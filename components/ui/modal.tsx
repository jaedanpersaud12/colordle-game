"use client";

import type {
  DialogProps,
  DialogTriggerProps,
  ModalOverlayProps,
} from "react-aria-components";
import {
  DialogTrigger as DialogTriggerPrimitive,
  ModalOverlay,
  Modal as ModalPrimitive,
} from "react-aria-components";
import { twJoin } from "tailwind-merge";
import { cx } from "@/lib/primitive";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseIcon,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const Modal = (props: DialogTriggerProps) => {
  return <DialogTriggerPrimitive {...props} />;
};

const sizes = {
  "2xs": "sm:max-w-2xs",
  xs: "sm:max-w-xs",
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  fullscreen: "",
};

interface ModalContentProps
  extends Omit<ModalOverlayProps, "children">,
    Pick<DialogProps, "aria-label" | "aria-labelledby" | "role" | "children"> {
  size?: keyof typeof sizes;
  closeButton?: boolean;
  isBlurred?: boolean;
  overlay?: Omit<ModalOverlayProps, "children">;
}

const ModalContent = ({
  className,
  isDismissable: isDismissableInternal,
  isBlurred = false,
  children,
  overlay,
  size = "lg",
  role = "dialog",
  closeButton = true,
  ...props
}: ModalContentProps) => {
  const isDismissable = isDismissableInternal ?? role !== "alertdialog";

  return (
    <ModalOverlay
      data-slot="modal-overlay"
      isDismissable={isDismissable}
      className={twJoin(
        "fixed inset-0 z-50 h-(--visual-viewport-height,100vh) bg-black/30",
        "grid grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr]",
        size === "fullscreen" ? "md:p-3" : "md:p-4",
        "data-[entering]:fade-in data-[entering]:animate-in data-[entering]:duration-[75ms] data-[entering]:ease-out",
        "data-[exiting]:fade-out data-[exiting]:animate-out data-[exiting]:duration-[50ms] data-[exiting]:ease-out",
        isBlurred && "backdrop-blur-sm"
      )}
      {...overlay}
      {...props}
    >
      <ModalPrimitive
        data-slot="modal-content"
        className={cx(
          "row-start-2 w-full text-left align-middle",
          "[--visual-viewport-vertical-padding:16px]",
          size === "fullscreen"
            ? "**:data-[slot=dialog-body]:min-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding)-var(--dialog-header-height,0px)-var(--dialog-footer-height,0px))] sm:rounded-none sm:[--visual-viewport-vertical-padding:16px]"
            : "sm:rounded-none sm:[--visual-viewport-vertical-padding:32px]",
          "relative overflow-hidden bg-overlay text-overlay-fg",
          "rounded-none shadow-lg border border-border",
          sizes[size],
          "data-[entering]:slide-in-from-bottom sm:data-[entering]:zoom-in-95 sm:data-[entering]:slide-in-from-bottom-0 data-[entering]:animate-in data-[entering]:duration-[75ms] data-[entering]:ease-out",
          "data-[exiting]:slide-out-to-bottom sm:data-[exiting]:zoom-out-95 sm:data-[exiting]:slide-out-to-bottom-0 data-[exiting]:animate-out data-[exiting]:duration-[50ms] data-[exiting]:ease-out",
          className
        )}
        {...props}
      >
        <Dialog role={role}>
          {(values) => (
            <>
              {typeof children === "function" ? children(values) : children}
              {closeButton && <DialogCloseIcon isDismissable={isDismissable} />}
            </>
          )}
        </Dialog>
      </ModalPrimitive>
    </ModalOverlay>
  );
};

const ModalTrigger = DialogTrigger;
const ModalHeader = DialogHeader;
const ModalTitle = DialogTitle;
const ModalDescription = DialogDescription;
const ModalFooter = DialogFooter;
const ModalBody = DialogBody;
const ModalClose = DialogClose;

export {
  Modal,
  ModalTrigger,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalOverlay,
};
