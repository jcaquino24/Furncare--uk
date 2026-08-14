(function () {
  document.addEventListener('pointerover', (event) => {
    const image = event.target.closest('.image-text-block__image');
    if (image) image.classList.add('is-hovered');
  });

  document.addEventListener('pointerout', (event) => {
    const image = event.target.closest('.image-text-block__image');
    if (image && !image.contains(event.relatedTarget)) {
      image.classList.remove('is-hovered');
    }
  });
})();