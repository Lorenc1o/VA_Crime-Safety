// Scroll Event Handling
let isScrolling;
window.addEventListener('wheel', event => {
    clearTimeout(isScrolling);

    isScrolling = setTimeout(() => {
        if (event.deltaY > 0) {
            scrollToSection('forward');
        } else if (event.deltaY < 0) {
            scrollToSection('backward');
        }
    }, 66); // 66ms timeout for debounce
}, false);

// Scroll to Section Function
function scrollToSection(direction) {
    let currentSection = document.querySelector('.section.active');
    let targetSection;

    if (direction === 'forward') {
        targetSection = currentSection.nextElementSibling;
    } else {
        targetSection = currentSection.previousElementSibling;
    }

    // Check if the target section exists
    if (targetSection && targetSection.classList.contains('section')) {
        // Calculate the position to scroll to
        const headerHeight = 100; // Height of your fixed header, adjust as needed
        const targetPosition = targetSection.offsetTop - headerHeight;

        // Scroll to the target position
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });

        updateActiveSection(targetSection);
    } else {
        // If there's no next/previous section, do nothing
        console.log("No more sections in this direction.");
    }
}

// Update Active Section and Navigation Circles
function updateActiveSection(newActiveSection) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    newActiveSection.classList.add('active');

    document.querySelectorAll('.nav-circle').forEach(circle => {
        circle.classList.remove('active');
        if (circle.getAttribute('data-target') === newActiveSection.id) {
            circle.classList.add('active');
        }
    });
}

// Initial Active Section
document.querySelector('.section').classList.add('active');
document.querySelector('.nav-circle').classList.add('active');

// Click Event on Navigation Circles
document.querySelectorAll('.nav-circle').forEach(circle => {
    circle.addEventListener('click', function() {
        let targetSectionId = this.getAttribute('data-target');
        let targetSection = document.getElementById(targetSectionId);
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateActiveSection(targetSection);
    });
});
