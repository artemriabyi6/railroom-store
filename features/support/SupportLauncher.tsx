"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ChatIcon, CloseIcon } from "@/components/ui/icons";
import { ContactForm } from "./ContactForm";
import styles from "./SupportLauncher.module.scss";

export function SupportLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close support chat" : "Contact us"}
        aria-expanded={open}
      >
        {open ? <CloseIcon size={20} /> : <ChatIcon size={22} />}
        <span className={styles.dot} aria-hidden="true" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Talk to us" variant="corner">
        <p className={styles.intro}>Questions about sizing, an order or a drop? Send us a message and we&apos;ll reply by email within one working day.</p>
        <ContactForm />
      </Dialog>
    </>
  );
}
