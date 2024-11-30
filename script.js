document.addEventListener("DOMContentLoaded", () => {
    const swiper = new Swiper(".swiper-container", {
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        loop: false, // Disable continuous loop
        spaceBetween: 30, // Space between slides
        slidesPerView: 1, // Only one slide at a time
        allowTouchMove: false, // Disable touch swipe
    });

    const canvasStates = {
        canvas1: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
        canvas2: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
        canvas3: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
    };

    let activeCanvasId = "canvas1";

    const getActiveCanvasState = () => canvasStates[activeCanvasId];

    const updateActiveCanvas = () => {
        const activeSlideIndex = swiper.activeIndex;
        activeCanvasId = `canvas${activeSlideIndex + 1}`;
    };

    const saveState = () => {
        const { elements, undoStack } = getActiveCanvasState();
        undoStack.push(JSON.stringify(elements));
        getActiveCanvasState().redoStack = [];
    };

    const renderElements = () => {
        const canvas = document.getElementById(activeCanvasId);
        const { elements } = getActiveCanvasState();
        canvas.innerHTML = ""; // Clear the canvas
    
        elements.forEach((el) => {
            if (el.type === "text") {
                const textDiv = document.createElement("div");
                textDiv.classList.add("text-element");
                textDiv.style.left = `${el.x}px`;
                textDiv.style.top = `${el.y}px`;
                textDiv.style.fontSize = `${el.fontSize}px`;
                textDiv.style.fontWeight = el.boldButton || "normal";
                textDiv.style.textDecoration = el.textDecoration || "none";
                textDiv.style.textTransform = el.textTransform || "none";
                textDiv.style.color = el.color || "black";
                textDiv.textContent = el.text;


                
                // Append the textDiv to the canvas
                canvas.appendChild(textDiv);
    
                // Double-click to edit
                addTextEditListener(textDiv, el, canvas);
                textDiv.addEventListener("pointerdown", (e) => startDragging(e, el))
               

            } else if (el.type === "image") {
                const imgWrapper = document.createElement("div");
                imgWrapper.style.position = "absolute";
                imgWrapper.style.left = `${el.x}px`;
                imgWrapper.style.top = `${el.y}px`;
                imgWrapper.style.width = `${el.width}px`;
                imgWrapper.style.height = `${el.height}px`;
                imgWrapper.style.border = el.selected ? "1px dashed blue" : "none";
    
                const img = document.createElement("img");
                img.src = el.src;
                img.style.width = "100%";
                img.style.height = "100%";
                img.draggable = false; // Prevent default drag behavior
    
                const resizeHandle = document.createElement("div");
                resizeHandle.style.position = "absolute";
                resizeHandle.style.right = "0";
                resizeHandle.style.bottom = "0";
                resizeHandle.style.width = "10px";
                resizeHandle.style.height = "10px";
                resizeHandle.style.backgroundColor = "blue";
                resizeHandle.style.cursor = "nwse-resize";
    
                resizeHandle.addEventListener("pointerdown", (e) => {
                    e.stopPropagation();
                    startResizing(e, el, imgWrapper);
                });
    
                imgWrapper.appendChild(img);
                imgWrapper.appendChild(resizeHandle);
    
                imgWrapper.addEventListener("pointerdown", (e) => {
                    e.stopPropagation();
                    if (!el.selected) {
                        saveState();
                        deselectAllElements();
                        el.selected = true;
                        renderElements();
                    }
                    startDragging(e, el);
                });
    
                canvas.appendChild(imgWrapper);
            }
        });
    };
    
    const addTextEditListener = (textDiv, el, canvas) => {
        textDiv.addEventListener("dblclick", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = el.text;
            input.style.position = "absolute";
            input.style.left = `${el.x}px`;
            input.style.top = `${el.y}px`;
            input.style.fontSize = `${el.fontSize}px`;
            input.style.fontWeight = `${el.boldButton || "normal"}`;
            input.style.textDecoration = `${el.textDecoration || "none"}`;
            input.style.textTransform = `${el.textTransform || "none"}`;
            input.style.color = `${el.color || "black"}`;
            canvas.appendChild(input);
            input.focus();
    
            input.addEventListener("blur", () => {
                el.text = input.value; // Update text in element
                saveState();
                renderElements(); // Re-render elements to reflect changes
            });
    
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    el.text = input.value; // Update text in element
                    saveState();
                    renderElements(); // Re-render elements to reflect changes
                }
            });
        });
    };


    const startResizing = (e, element, imgWrapper) => {
        const canvas = document.getElementById(activeCanvasId);
        const canvasRect = canvas.getBoundingClientRect();
    
        const initialX = e.clientX;
        const initialY = e.clientY;
        const initialWidth = imgWrapper.offsetWidth;
        const initialHeight = imgWrapper.offsetHeight;
    
        const onPointerMove = (e) => {
            let newWidth = initialWidth + (e.clientX - initialX);
            let newHeight = initialHeight + (e.clientY - initialY);
    
            // Ensure the image stays within canvas bounds
            newWidth = Math.max(20, Math.min(canvasRect.width - element.x, newWidth));
            newHeight = Math.max(20, Math.min(canvasRect.height - element.y, newHeight));
    
            element.width = newWidth;
            element.height = newHeight;
    
            renderElements();
        };
    
        const stopResizing = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", stopResizing);
            saveState(); // Save the final size
        };
    
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", stopResizing);
    };
    

    const addTextButton = document.getElementById("addText");
    addTextButton.addEventListener("click", () => {
        saveState();
        const { elements } = getActiveCanvasState();
        elements.push({
            id: Date.now(),
            type: "text",
            text: "New Text",
            x: 50,
            y: 50,
            fontSize: 16,
        });
        renderElements();
    });


    // Undo and redo functionality
    const undoButton = document.getElementById("undo");
    const redoButton = document.getElementById("redo");

    undoButton.addEventListener("click", () => {
      const state = getActiveCanvasState();
      if (state.undoStack.length > 0) {
        state.redoStack.push(JSON.stringify(state.elements));
        state.elements = JSON.parse(state.undoStack.pop());
        renderElements();
      }
    });
  
    redoButton.addEventListener("click", () => {
      const state = getActiveCanvasState();
      if (state.redoStack.length > 0) {
        state.undoStack.push(JSON.stringify(state.elements));
        state.elements = JSON.parse(state.redoStack.pop());
        renderElements();
      }
    });
  
    // Styling functionality
    const boldButton = document.getElementById("bold");
    const underlineButton = document.getElementById("underline");
    const uppercaseButton = document.getElementById("uppercase");
    const lowercaseButton = document.getElementById("lowercase");
    const textColorInput = document.getElementById("textColor");
    const fontSizeSelect = document.getElementById("fontSize");

    boldButton.addEventListener("click", () => {
        const state = getActiveCanvasState();
        if (state.selectedElement) {
            saveState();
            state.selectedElement.fontWeight =
                state.selectedElement.fontWeight === "bold" ? "normal" : "bold";
            renderElements();
        }
    });
    
  
    underlineButton.addEventListener("click", () => {
      const state = getActiveCanvasState();
      if (state.selectedElement) {
        saveState();
        state.selectedElement.textDecoration =
          state.selectedElement.textDecoration === "underline" ? "none" : "underline";
        renderElements();
      }
    });
  
    uppercaseButton.addEventListener("click", () => {
      const state = getActiveCanvasState();
      if (state.selectedElement) {
        saveState();
        state.selectedElement.textTransform = "uppercase";
        renderElements();
      }
    });
  
    lowercaseButton.addEventListener("click", () => {
      const state = getActiveCanvasState();
      if (state.selectedElement) {
        saveState();
        state.selectedElement.textTransform = "lowercase";
        renderElements();
      }
    });
  
    textColorInput.addEventListener("input", (e) => {
      const state = getActiveCanvasState();
      if (state.selectedElement) {
        saveState();
        state.selectedElement.color = e.target.value;
        renderElements();
      }
    });
  
    fontSizeSelect.addEventListener("change", (e) => {
      const state = getActiveCanvasState();
      if (state.selectedElement) {
        saveState();
        state.selectedElement.fontSize = Number(e.target.value);
        renderElements();
      }
    });


    // Insert image functionality
    const insertImageButton = document.getElementById("insertImage");
    insertImageButton.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";

        fileInput.addEventListener("change", () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const { elements } = getActiveCanvasState();
                    saveState();
                    elements.push({
                        id: Date.now(),
                        type: "image",
                        src: e.target.result,
                        x: 50,
                        y: 50,
                        width: 100,
                        height: 100,
                    });
                    renderElements();
                };
                reader.readAsDataURL(file);
            }
        });

        fileInput.click();
        
    });

    const startDragging = (e, element) => {
        const state = getActiveCanvasState();
        state.selectedElement = element;
        const canvas = document.getElementById(activeCanvasId);
        const canvasRect = canvas.getBoundingClientRect();
    
        const offsetX = e.clientX - element.x;
        const offsetY = e.clientY - element.y;
    
        const onPointerMove = (e) => {
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;
    
            // Ensure the element stays within canvas bounds
            newX = Math.max(0, Math.min(canvasRect.width - (element.width || 0), newX));
            newY = Math.max(0, Math.min(canvasRect.height - (element.height || 0), newY));
    
            element.x = newX;
            element.y = newY;
    
            renderElements();
        };
    
        const stopDragging = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", stopDragging);
            saveState(); // Save the final position
        };
    
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", stopDragging);
    };
    
    const deselectAllElements = () => {
        Object.values(canvasStates).forEach((state) =>
            state.elements.forEach((el) => (el.selected = false))
        );
    };

    swiper.on("slideChange", () => {
        updateActiveCanvas();
        renderElements();
    });

    renderElements();
});
