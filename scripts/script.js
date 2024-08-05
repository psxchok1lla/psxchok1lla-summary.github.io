document.addEventListener('DOMContentLoaded', () => {
  const addIcon = document.getElementById('add-icon');
  const editIcon = document.getElementById('edit-icon');
  const languagesList = document.getElementById('languages-list');
  let isEditable = false;
  let selectedBlock = null;

  // Function to update the visibility of the edit button
  function updateEditButton() {
    if (languagesList.children.length === 0) {
      editIcon.style.display = 'none';
    } else {
      editIcon.style.display = 'inline-block';
    }
  }

  // Add new language block
  addIcon.addEventListener('click', (e) => {
    e.preventDefault();
    addLanguageBlock();
    if (!isEditable) {
      editIcon.click(); // Enable edit mode
    }
  });

  // Toggle edit mode
  editIcon.addEventListener('click', (e) => {
    e.preventDefault();
    isEditable = !isEditable;
    document.querySelectorAll('.languages__skills').forEach((block) => {
      const name = block.querySelector('.name__languages');
      name.contentEditable = isEditable;
      block
        .querySelector('.languages__level')
        .classList.toggle('editable', isEditable);
      if (!isEditable && block.classList.contains('selected')) {
        block.classList.remove('selected');
      }
      // Remove the block if name is empty after edit mode is disabled
      if (!isEditable && !name.textContent.trim()) {
        block.remove();
      }
    });
  });

  // Function to create a new language block
  function addLanguageBlock(language = 'New Language', level = 0) {
    const languageBlock = document.createElement('div');
    languageBlock.classList.add('languages__skills', 'selected');

    languageBlock.innerHTML = `
          <div class="name__languages" contenteditable="true" data-placeholder="New Language"></div>
          <div class="languages__level">
              <div class="level" style="width: ${level * 12.5}%;"></div>
              <div class="ripple"></div>
          </div>
          <button class="delete-icon">&times;</button>
      `;

    const nameField = languageBlock.querySelector('.name__languages');
    const levelBar = languageBlock.querySelector('.languages__level');
    const levelIndicator = languageBlock.querySelector('.level');
    const deleteIcon = languageBlock.querySelector('.delete-icon');

    // Add language block to the list
    languagesList.appendChild(languageBlock);
    updateEditButton();

    // Focus on the new language block
    nameField.focus();

    // Adjust level in real time with ripple effect
    let isDragging = false;

    levelBar.addEventListener('mousedown', (e) => {
      if (!isEditable) return;
      isDragging = true;
      createRipple(e, levelBar);
      updateLevel(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (!isEditable) return;
      if (isDragging) {
        updateLevel(e);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    function updateLevel(e) {
      const rect = levelBar.getBoundingClientRect();
      const width = rect.width;
      const clickX = e.clientX - rect.left;
      const segmentWidth = width / 8;
      const newLevel = Math.round(clickX / segmentWidth);
      levelIndicator.style.width = `${Math.min(Math.max(newLevel, 0), 8) * 12.5}%`;
    }

    function createRipple(event, element) {
      const ripple = element.querySelector('.ripple');
      ripple.style.left = `${event.clientX - element.getBoundingClientRect().left}px`;
      ripple.style.top = `${event.clientY - element.getBoundingClientRect().top}px`;
      ripple.classList.add('show');
      ripple.addEventListener('animationend', () => {
        ripple.classList.remove('show');
      });
    }

    // Highlight block and show delete icon
    languageBlock.addEventListener('click', (e) => {
      if (!isEditable) return;
      if (selectedBlock && selectedBlock !== languageBlock) {
        selectedBlock.classList.remove('selected');
      }
      languageBlock.classList.toggle('selected');
      selectedBlock = languageBlock.classList.contains('selected')
        ? languageBlock
        : null;
    });

    // Delete block
    deleteIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      languagesList.removeChild(languageBlock);
      selectedBlock = null;
      updateEditButton();
    });

    // Check if name is empty after edit mode is disabled
    nameField.addEventListener('blur', () => {
      if (!nameField.textContent.trim() && !isEditable) {
        languagesList.removeChild(languageBlock);
        updateEditButton();
      }
    });
  }

  // Deselect the selected block if click outside
  document.addEventListener('click', (e) => {
    if (selectedBlock && !languagesList.contains(e.target)) {
      selectedBlock.classList.remove('selected');
      selectedBlock = null;
    }
  });

  // Initial call to hide the edit button if there are no blocks
  updateEditButton();

  // Download resume as PDF
  const downloadBtn = document.getElementById('download-btn');
  const container = document.querySelector('.button-container');
  let moving = false;
  let dx = 10; // 5 times faster than before
  let dy = 10; // 5 times faster than before

  function moveButton() {
    if (moving) {
      let buttonRect = downloadBtn.getBoundingClientRect();
      let containerRect = container.getBoundingClientRect();

      if (
        buttonRect.right >= containerRect.right ||
        buttonRect.left <= containerRect.left
      ) {
        dx = -dx;
      }
      if (
        buttonRect.bottom >= containerRect.bottom ||
        buttonRect.top <= containerRect.top
      ) {
        dy = -dy;
      }

      downloadBtn.style.left = downloadBtn.offsetLeft + dx + 'px';
      downloadBtn.style.top = downloadBtn.offsetTop + dy + 'px';

      requestAnimationFrame(moveButton);
    }
  }

  container.addEventListener('mouseover', () => {
    moving = true;
    moveButton();
  });

  container.addEventListener('mouseleave', () => {
    moving = false;
  });

  downloadBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;

    html2canvas(document.querySelector('.content__wrapper')).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('resume.pdf');
    });
  });
});
