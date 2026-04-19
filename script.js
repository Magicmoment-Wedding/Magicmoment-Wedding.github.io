document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Fade-in on Scroll Animation ---
    const fadeElements = document.querySelectorAll('.fade-in-up');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);
    
    fadeElements.forEach(el => observer.observe(el));


    // --- 2. Before/After Slider Logic ---
    const sliderContainer = document.querySelector('.image-slider');
    const imageBefore = document.querySelector('.image-before');
    const sliderHandle = document.querySelector('.slider-handle');
    const beforeImg = document.querySelector('.image-before img');

    if (sliderContainer && imageBefore && sliderHandle) {
        // We need to keep the image width constant to avoid stretching
        const updateImageWidth = () => {
            const containerWidth = sliderContainer.getBoundingClientRect().width;
            beforeImg.style.width = `${containerWidth}px`;
        };

        window.addEventListener('resize', updateImageWidth);
        updateImageWidth();

        let isDragging = false;

        const moveSlider = (clientX) => {
            const rect = sliderContainer.getBoundingClientRect();
            let xPos = clientX - rect.left;
            
            // Boundary constraints
            if (xPos < 0) xPos = 0;
            if (xPos > rect.width) xPos = rect.width;

            const percentage = (xPos / rect.width) * 100;
            
            imageBefore.style.width = `${percentage}%`;
            sliderHandle.style.left = `${percentage}%`;
        };

        sliderHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault(); // Prevent text selection
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            moveSlider(e.clientX);
        });

        // Touch support
        sliderHandle.addEventListener('touchstart', (e) => {
            isDragging = true;
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            moveSlider(e.touches[0].clientX);
        });
    }


    // --- 3. Upload & Style Selection Logic ---
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const startBtn = document.getElementById('start-btn');
    const styleBtns = document.querySelectorAll('.style-btn');
    
    let selectedFile = null;
    let selectedStyle = '파리 에펠탑';

    // Style Selection
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStyle = btn.textContent;
        });
    });

    // File Drag and Drop
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });
        
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });

        function handleFiles(files) {
            if (files.length > 0) {
                selectedFile = files[0];
                fileNameDisplay.textContent = `선택된 파일: ${selectedFile.name}`;
                startBtn.disabled = false;
                startBtn.textContent = '변환 시작하기';
            }
        }
    }

    // Start Conversion Mock
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!selectedFile) return;
            
            startBtn.disabled = true;
            startBtn.textContent = '이미지 분석 중... (데모)';
            
            setTimeout(() => {
                startBtn.textContent = 'AI 프롬프트 생성 중...';
                
                setTimeout(() => {
                    startBtn.textContent = '배경 렌더링 중...';
                    
                    setTimeout(() => {
                        alert(`'${selectedFile.name}' 파일이 '${selectedStyle}' 스타일로 변환 완료되었습니다! (데모 버전에서는 다운로드가 생략됩니다)`);
                        startBtn.disabled = false;
                        startBtn.textContent = '다시 변환하기';
                    }, 1500);
                }, 1500);
            }, 1500);
        });
    }

    // --- 4. Navbar Background on Scroll ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    });
});
