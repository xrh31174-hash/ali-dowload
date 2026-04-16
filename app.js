document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("download-form");
    const input = document.getElementById("url-input");
    const mainView = document.getElementById("main-view");
    const resultView = document.getElementById("result-view");
    const downloadBtn = document.getElementById("submit-btn");
    
    // Result elements
    const resultVideo = resultView.querySelector("video");
    const downloadMainBtn = resultView.querySelector(".download-main-btn");
    
    // FAQ Accordion
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        question.addEventListener("click", () => {
            const answer = item.querySelector(".faq-answer");
            const icon = item.querySelector(".faq-icon");
            const isOpen = answer.style.maxHeight;
            
            // Close all other
            document.querySelectorAll('.faq-answer').forEach(a => a.style.maxHeight = null);
            document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');
            
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // Form Submit API Call
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const url = input.value.trim();
        if (!url) return;

        // Simulate loading state
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<div class="spinner"></div> Обработка...';
        downloadBtn.disabled = true;

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Неизвестная ошибка сервера");
            }

            // Bind returned data to result view
            resultVideo.src = data.videoUrl;
            if (data.thumbnail) {
                resultVideo.poster = data.thumbnail;
            }
            
            // Update download button to use local proxy to force download
            downloadMainBtn.href = `/api/proxy?url=${encodeURIComponent(data.videoUrl)}`;
            // Remove target blank so it downloads in current tab directly
            downloadMainBtn.removeAttribute('target');
            downloadMainBtn.download = `instagram_${Date.now()}.mp4`;
            
            // Transition to result view
            mainView.style.opacity = '0';
            setTimeout(() => {
                mainView.style.display = 'none';
                resultView.style.display = 'flex';
                // Trigger reflow for animation
                void resultView.offsetWidth;
                resultView.style.opacity = '1';
                
                // Keep viewport near top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);

        } catch (error) {
            alert(error.message);
        } finally {
            // Restore form button
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }
    });

});
