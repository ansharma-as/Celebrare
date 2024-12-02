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
        loop: false, 
        spaceBetween: 30, 
        slidesPerView: 1, 
        allowTouchMove: false, 
    });

    const canvasStates = {
            canvas1: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
            canvas2: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
            canvas3: { elements: [], undoStack: [], redoStack: [], selectedElement: null },
        
    };
    const addNewCanvas = () => {
        const newCanvasId = `canvas${Object.keys(canvasStates).length + 1}`;
        canvasStates[newCanvasId] = { elements: [], undoStack: [], redoStack: [], selectedElement: null };
    
        // Create and add a new Swiper slide
        const newSlide = document.createElement("div");
        newSlide.className = "swiper-slide";
        const canvas = document.createElement("div");
        canvas.id = newCanvasId;
        canvas.className = "canvas";
        newSlide.appendChild(canvas);
        document.querySelector(".swiper-wrapper").appendChild(newSlide);
    
        swiper.update();
        updatePagePreviews();
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

                if (el.boldButton) {
                    textDiv.classList.add("bold");
                }

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
                el.text = input.value; 
                saveState();
                renderElements();
            });
    
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    el.text = input.value; 
                    saveState();
                    renderElements(); 
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

    document.getElementById('download').addEventListener('click', function () {
        const canvasElement = document.getElementById(activeCanvasId);
        const { elements } = getActiveCanvasState();
    
        // Create a jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
    
        // PDF settings
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
    
        // Create a temporary canvas to render elements
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasElement.offsetWidth;
        tempCanvas.height = canvasElement.offsetHeight;
        const tempContext = tempCanvas.getContext("2d");
    
        // Render each element onto the temp canvas
        elements.forEach((el) => {
            if (el.type === "text") {
                tempContext.font = `${el.boldButton || "normal"} ${el.fontSize}px Arial`;
                tempContext.fillStyle = el.color || "black";
                tempContext.fillText(el.text, el.x, el.y);
            } else if (el.type === "image") {
                const img = new Image();
                img.src = el.src;
                img.onload = () => {
                    tempContext.drawImage(img, el.x, el.y, el.width, el.height);
                };
            }
        });
    
        // Wait a short time to ensure all images are rendered
        setTimeout(() => {
            // Convert the canvas to an image data URL
            const imgData = tempCanvas.toDataURL("image/png");
    
            // Add the canvas image to the PDF
            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    
            // Save the PDF
            pdf.save(`${activeCanvasId}.pdf`);
        }, 500);
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
        state.selectedElement.boldButton = !state.selectedElement.boldButton; // Toggle boldButton
        renderElements(); // Re-render elements to reflect the change
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
            newX = Math.max(0, Math.min(canvasRect.width - (element.width || 50), newX));
            newY = Math.max(0, Math.min(canvasRect.height - (element.height || 30), newY));
    
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
    

// Open the page editing modal
const editPagesButton = document.getElementById('editPages');
const pageEditingModal = document.getElementById('pageEditingModal');
const closeButton = document.getElementsByClassName('close-button')[0];

editPagesButton.addEventListener('click', () => {
  pageEditingModal.style.display = 'block';
  populatePageList();
});

closeButton.addEventListener('click', () => {
  pageEditingModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target == pageEditingModal) {
    pageEditingModal.style.display = 'none';
  }
});


// Enable drag-and-drop and add delete functionality for page list items
const populatePageList = () => {
    const pageListContainer = document.querySelector(".page-list");
    pageListContainer.innerHTML = "";
  
    swiper.slides.forEach((slide, index) => {
      const pageItem = document.createElement("div");
      pageItem.classList.add("page-item");
      pageItem.textContent = `Page ${index + 1}`;
      pageItem.setAttribute("draggable", true);
      pageItem.setAttribute("data-index", index);
  
      // Drag start event
      pageItem.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index);
        pageItem.classList.add("dragging");
      });
  
      // Drag end event
      pageItem.addEventListener("dragend", () => {
        pageItem.classList.remove("dragging");
      });
  
      // Drag over event
      pageItem.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(pageListContainer, e.clientY);
        if (afterElement == null) {
          pageListContainer.appendChild(draggingItem);
        } else {
          pageListContainer.insertBefore(draggingItem, afterElement);
        }
      });
  
      // Drop event
      pageItem.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const targetIndex = parseInt(pageItem.getAttribute("data-index"));
  
        if (draggedIndex !== targetIndex) {
          reorderPages(draggedIndex, targetIndex);
          populatePageList(); // Re-render the list
        }
      });
  
      // Add Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete-button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deletePage(index);
      });
  
      pageItem.appendChild(deleteButton);
      pageListContainer.appendChild(pageItem);
    });

    //updating the sidebar
    updateSidebar();

  };
  
  // Function to get the element after which the dragged item should be placed
  const getDragAfterElement = (container, y) => {
    const draggableElements = [...container.querySelectorAll(".page-item:not(.dragging)")];
  
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };
  
  // Function to reorder Swiper slides and canvasStates based on drag-and-drop
  const reorderPages = (fromIndex, toIndex) => {
    const slides = Array.from(swiper.slides);
    const [movedSlide] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, movedSlide);
  
    swiper.removeAllSlides();
    swiper.appendSlide(slides);
  
    const canvasKeys = Object.keys(canvasStates);
    const [movedCanvasKey] = canvasKeys.splice(fromIndex, 1);
    canvasKeys.splice(toIndex, 0, movedCanvasKey);
  
    const reorderedCanvasStates = {};
    canvasKeys.forEach((key, i) => {
      reorderedCanvasStates[`canvas${i + 1}`] = canvasStates[key];
    });
  
    Object.assign(canvasStates, reorderedCanvasStates);
  
    updateCanvasIds();
    updateActiveCanvas();
    renderElements();
  };
  
  // Function to delete a page
  const deletePage = (index) => {
    swiper.removeSlide(index);
  
    // Remove the corresponding canvas state
    const canvasKeys = Object.keys(canvasStates);
    const deletedKey = canvasKeys[index];
    delete canvasStates[deletedKey];
  
    // Reorder canvasStates to maintain consistency
    const reorderedCanvasStates = {};
    Object.keys(canvasStates).forEach((key, i) => {
      reorderedCanvasStates[`canvas${i + 1}`] = canvasStates[key];
    });
  
    Object.assign(canvasStates, reorderedCanvasStates);
  
    // Re-render the page list
    populatePageList();
    updateCanvasIds();
    updateActiveCanvas();
    renderElements();
    updateSidebar();

  };
  
  // Function to update canvas IDs to maintain proper order
  const updateCanvasIds = () => {
    Object.keys(canvasStates).forEach((key, index) => {
      const canvas = document.getElementById(key);
      if (canvas) {
        canvas.id = `canvas${index + 1}`;
      }
    });
  };
  


// Add a new page
const addPageButton = document.getElementById('addPage');
addPageButton.addEventListener('click', () => {
    const newPageIndex = swiper.slides.length;
    const newPageElement = document.createElement('div');
    newPageElement.classList.add('swiper-slide');
    newPageElement.innerHTML = `<div class="canvas" id="canvas${newPageIndex + 1}"></div>`;
    swiper.appendSlide(newPageElement);
    
    // Initialize the canvas state for the new page
    canvasStates[`canvas${newPageIndex + 1}`] = { elements: [], undoStack: [], redoStack: [], selectedElement: null };
    
    // Render the elements for the new page
    updateActiveCanvas();
    renderElements();
  
    // Populate the page list and update sidebar
    populatePageList();
    updateSidebar(); // Add this line
  });
  
  function deletePageAtIndex(index) {
    swiper.removeSlide(index);
    delete canvasStates[`canvas${index + 1}`];
    populatePageList();
    updateActiveCanvas();
    renderElements();
    updateSidebar(); // Add this line
  }


// Save changes
const saveChangesButton = document.getElementById('saveChanges');
const cancelChangesButton = document.getElementById('cancelChanges');

saveChangesButton.addEventListener('click', () => {
  pageEditingModal.style.display = 'none';
  // Save the current state of the canvases
  for (const [key, value] of Object.entries(canvasStates)) {
    localStorage.setItem(`${key}_elements`, JSON.stringify(value.elements));
    localStorage.setItem(`${key}_undoStack`, JSON.stringify(value.undoStack));
    localStorage.setItem(`${key}_redoStack`, JSON.stringify(value.redoStack));
  }
});


// Store initial state of slides
let initialSlideCount = swiper.slides.length;

// Function to update the initial state when needed
function updateInitialState() {
initialSlideCount = swiper.slides.length;
}

// Modify the cancel logic to handle added pages
cancelChangesButton.addEventListener("click", () => {
  pageEditingModal.style.display = "none";

  // Restore the previous state of the canvases
  for (const [key, value] of Object.entries(canvasStates)) {
    value.elements = JSON.parse(localStorage.getItem(`${key}_elements`) || "[]");
    value.undoStack = JSON.parse(localStorage.getItem(`${key}_undoStack`) || "[]");
    value.redoStack = JSON.parse(localStorage.getItem(`${key}_redoStack`) || "[]");
  }

  // Remove the additional pages added during the editing session
  while (swiper.slides.length > initialSlideCount) {
    swiper.removeSlide(swiper.slides.length - 1); // Remove from the end
  }

  // Re-populate the page list and update active canvas
  populatePageList();
  updateActiveCanvas();
  renderElements();
});


// const updatePagePreviews = () => {
//     const previewContainer = document.querySelector(".sidebar .page-preview-container");
//     previewContainer.innerHTML = "";

//     swiper.slides.forEach((_, index) => {
//         const preview = document.createElement("div");
//         preview.className = "page-preview";
//         preview.textContent = `Page ${index + 1}`;
//         preview.addEventListener("click", () => swiper.slideTo(index));
//         previewContainer.appendChild(preview);
//     });
// };
const pagePreviewElements = document.querySelectorAll('.page-preview');
pagePreviewElements.forEach((preview, index) => {
    preview.addEventListener('click', () => {
        swiper.slideTo(index);
        
        // Remove active class from all previews
        pagePreviewElements.forEach(el => el.classList.remove('active'));
        
        // Add active class to clicked preview
        preview.classList.add('active');
    });
});


swiper.on("slideChange", () => {
    updateActiveCanvas();
    const pagePreviews = document.querySelectorAll(".page-preview");
    pagePreviews.forEach(preview => preview.classList.remove("active"));
    if (pagePreviews[swiper.activeIndex]) {
        pagePreviews[swiper.activeIndex].classList.add("active");
    }
});


function updateSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const pagePreviewContainer = sidebar.querySelector('.page-preview-container') || 
        (() => {
            const container = document.createElement('div');
            container.classList.add('page-preview-container');
            sidebar.insertBefore(container, sidebar.querySelector('#editPages'));
            return container;
        })();

    // Clear existing previews
    pagePreviewContainer.innerHTML = '';

    // Create preview for each slide
    for (let i = 3; i < swiper.slides.length; i++) {
        const preview = document.createElement('div');
        preview.classList.add('page-preview');
        preview.dataset.index = i;

        // Create a canvas to generate preview image
        const canvas = document.getElementById(`canvas${i + 1}`);
        const previewImg = document.createElement('img');
        previewImg.alt = `Canvas ${i + 1} Preview`;

        // Convert canvas to image
        html2canvas(canvas).then(previewCanvas => {
            previewImg.src = previewCanvas.toDataURL();
            preview.appendChild(previewImg);
        });

        preview.addEventListener('click', () => {
            swiper.slideTo(i);
            
            // Remove active class from all previews
            sidebar.querySelectorAll('.page-preview').forEach(el => el.classList.remove('active'));
            
            // Add active class to clicked preview
            preview.classList.add('active');
        });
        
        pagePreviewContainer.appendChild(preview);
    }
    
    // Set first preview as active if slides exist
    if (swiper.slides.length > 0) {
        const firstPreview = pagePreviewContainer.querySelector('.page-preview');
        if (firstPreview) firstPreview.classList.add('active');
    }
}



// Automatically mark first preview as active initially
pagePreviewElements[0].classList.add('active');

// Sync active preview with Swiper's current slide
swiper.on('slideChange', function () {
    document.querySelectorAll('.page-preview').forEach(el => el.classList.remove('active'));
    const activePreview = document.querySelector(`.page-preview[data-index="${swiper.activeIndex}"]`);
    if (activePreview) activePreview.classList.add('active');
  });
  



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
    setTimeout(updateSidebar, 100);

});
