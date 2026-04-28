"use client";

import { useEffect, useRef } from "react";

export default function IyzicoForm({ content }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !content) return;

        container.innerHTML = content;

        const scripts = Array.from(container.querySelectorAll("script"));
        scripts.forEach((oldScript) => {
            const script = document.createElement("script");

            Array.from(oldScript.attributes).forEach((attr) => {
                script.setAttribute(attr.name, attr.value);
            });

            script.text = oldScript.textContent;
            oldScript.parentNode.replaceChild(script, oldScript);
        });

        return () => {
            container.innerHTML = "";
        };
    }, [content]);

    return <div ref={containerRef} />;
}
