import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { createMarkup } from './app/createMarkup';
import { PixabayAPI } from './app/PixabayAPI';
import { refs } from './app/refs';
import { notifyInit } from './app/notifyInit';

const modalLightboxGallery = new SimpleLightbox('.gallery a', {
    captionDelay: 250,
});

const pixaby = new PixabayAPI();

const options = {
    root: null,
    rootMargin: '100px',
    threshold: 1.0,
};

const loadMorePhotos = async function (entries, observer) {
    entries.forEach(async entry => {
        if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            pixaby.incrementPage();

            try {
                const { hits } = await pixaby.getPhotos();
                const markup = createMarkup(hits);
                refs.gallery.insertAdjacentHTML('beforeend', markup);

                if (pixaby.hasMorePhotos) {
                    const lastItem = document.querySelector('.gallery a:last-child');
                    observer.observe(lastItem);
                } else
                    Notify.info(
                        "We're sorry, but you've reached the end of search results.",
                        notifyInit
                    );

                modalLightboxGallery.refresh();
            } catch (error) {
                Notify.failure(error.message, 'Something went wrong!', notifyInit);
                clearPage();
            }
        }
    });
};

const observer = new IntersectionObserver(loadMorePhotos, options);

const onSubmitClick = async event => {
    event.preventDefault();

    const {
        elements: { searchQuery },
    } = event.target;

    const search_query = searchQuery.value.trim().toLowerCase();

    if (!search_query) {
        clearPage();
        Notify.info('Enter data to search!', notifyInit);

        refs.searchInput.placeholder = 'What`re we looking for?';
        return;
    }

    pixaby.query = search_query;

    clearPage();

    try {
        const { hits, total } = await pixaby.getPhotos();

        if (hits.length === 0) {
            Notify.failure(
                `Sorry, there are no images matching your ${search_query}. Please try again.`,
                notifyInit
            );

            return;
        }

        const markup = createMarkup(hits);
        refs.gallery.insertAdjacentHTML('beforeend', markup);

        pixaby.setTotal(total);
        Notify.success(`Hooray! We found ${total} images.`, notifyInit);

        if (pixaby.hasMorePhotos) {
            const lastItem = document.querySelector('.gallery a:last-child');
            observer.observe(lastItem);
        }

        modalLightboxGallery.refresh();
    } catch (error) {
        Notify.failure(error.message, 'Something went wrong!', notifyInit);

        clearPage();
    }
};

refs.form.addEventListener('submit', onSubmitClick);

function clearPage() {
    pixaby.resetPage();
    refs.gallery.innerHTML = '';
}