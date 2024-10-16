import mermaid from "mermaid";
import { useEffect, useRef } from "react";

mermaid.initialize({});

const MermaidComponent = ({ source, id }: { source: string; id: string }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeMermaid = async () => {
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = source;
                const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${id}`, source);
                mermaidRef.current.innerHTML = svg;
                bindFunctions?.(mermaidRef.current);
            }
        };

        initializeMermaid();

        // Clean up mermaid instance when unmounting; doing nothing at the moment
        return () => {};
    }, [source]);

    const downloadSVG = () => {
        if (mermaidRef.current) {
            const svgContent = mermaidRef.current.innerHTML;
            const blob = new Blob([svgContent], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = `${id}.svg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(url);
        }
    };

    return (
        <div>
            <div id={id} ref={mermaidRef}></div>
            <button onClick={downloadSVG}>Download SVG</button>
        </div>
    );
};

export default MermaidComponent;