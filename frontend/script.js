document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- DOM Elements ---
    const welcomeView = document.getElementById('welcome-view');
    const searchResultsView = document.getElementById('search-results-view');
    const nftGalleryView = document.getElementById('nft-gallery-view');
    const profileView = document.getElementById('profile-view');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResultsContainer = document.getElementById('search-results');

    const nftGallery = document.getElementById('nft-gallery');
    const profileContent = document.getElementById('profile-content');

    const backToMainButton = document.getElementById('back-to-main');
    const backFromProfileButton = document.getElementById('back-from-profile');

    // --- TON Connect UI Initialization ---
    const tonConnectUI = new TONConnectUI.TonConnectUI({
        manifestUrl: '/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    // --- View Management ---
    function showView(viewToShow) {
        [welcomeView, searchResultsView, nftGalleryView, profileView].forEach(view => {
            view.classList.add('hidden');
        });
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }
    }

    // --- Event Listeners ---
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    backToMainButton.addEventListener('click', () => showView(welcomeView));
    backFromProfileButton.addEventListener('click', () => {
        if(searchInput.value){
            showView(searchResultsView);
        } else {
            showView(welcomeView);
        }
    });

    // --- State Management ---
    tonConnectUI.onStatusChange(async wallet => {
        if (wallet) {
            await handleWalletConnected(wallet);
            showView(nftGalleryView);
        } else {
            handleWalletDisconnected();
            showView(welcomeView);
        }
    });

    // --- Functions ---
    async function handleWalletConnected(wallet) {
        const userData = tg.initDataUnsafe?.user;
        if (!userData) {
            console.error("Could not retrieve Telegram user data.");
            tg.showAlert("Error: Could not get Telegram user info. Please open this app through Telegram.");
            return;
        }

        const payload = {
            telegram_id: userData.id,
            wallet_address: wallet.account.address,
            username: userData.username,
            first_name: userData.first_name,
            init_data: tg.initData
        };

        try {
            await fetch('/api/connect_wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('User data sent to backend.');
            await fetchAndDisplayMyNFTs(payload.wallet_address);
        } catch (error) {
            console.error('Error sending data to backend:', error);
            tg.showAlert('Could not connect wallet. Please try again.');
        }
    }

    function handleWalletDisconnected() {
        nftGallery.innerHTML = '';
        console.log('Wallet disconnected.');
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            return;
        }

        try {
            const response = await fetch(`/api/search/users?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            displaySearchResults(data.users);
            showView(searchResultsView);
        } catch (error) {
            console.error('Search failed:', error);
            searchResultsContainer.innerHTML = '<p>Search failed. Please try again.</p>';
        }
    }

    function displaySearchResults(users) {
        searchResultsContainer.innerHTML = '';
        if (users.length === 0) {
            searchResultsContainer.innerHTML = '<p>No users found.</p>';
            return;
        }
        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-result-item';
            item.innerHTML = `
                <div class="user-avatar"></div>
                <div class="user-info">
                    <p><strong>${user.first_name || 'User'}</strong> (@${user.username || '...'})</p>
                    <p class="nft-count">${user.nft_count} NFTs</p>
                </div>
            `;
            item.onclick = () => showProfile(user.telegram_id);
            searchResultsContainer.appendChild(item);
        });
    }

    async function fetchAndDisplayMyNFTs(walletAddress) {
        nftGallery.innerHTML = '<p>Loading your awesome NFTs...</p>';
        await renderNftsToGallery(walletAddress, nftGallery);
    }

    async function showProfile(telegramId) {
        showView(profileView);
        profileContent.innerHTML = '<p>Loading profile...</p>';

        try {
            const profileRes = await fetch(`/api/profile/${telegramId}`);
            if (!profileRes.ok) throw new Error('Profile not found');
            const profileData = await profileRes.json();

            profileContent.innerHTML = `
                <div class="profile-header">
                    <div class="user-avatar-large"></div>
                    <div class="profile-info">
                        <h1>${profileData.first_name || 'User'}'s Profile</h1>
                        <p>@${profileData.username || 'No username'}</p>
                        <p><strong>Wallet:</strong> ${profileData.wallet_address.slice(0, 6)}...${profileData.wallet_address.slice(-4)}</p>
                        <a href="https://t.me/${profileData.username}" target="_blank" class="contact-button" style="${profileData.username ? '' : 'display:none;'}">
                            Write to Owner
                        </a>
                    </div>
                </div>
                <h3>NFT Collection</h3>
                <div id="profile-nft-gallery" class="gallery">Loading NFTs...</div>
            `;

            const gallery = profileContent.querySelector('#profile-nft-gallery');
            await renderNftsToGallery(profileData.wallet_address, gallery);

        } catch (error) {
            console.error('Failed to load profile:', error);
            profileContent.innerHTML = `<p>Could not load profile.</p>`;
        }
    }

    async function renderNftsToGallery(walletAddress, galleryElement) {
        try {
            const nftsRes = await fetch(`/api/nfts/${walletAddress}`);
            if (!nftsRes.ok) throw new Error('Failed to load NFTs');
            const data = await nftsRes.json();
            const nfts = data.nfts;

            if (nfts.length === 0) {
                galleryElement.innerHTML = '<p>No NFTs found in this wallet.</p>';
                return;
            }

            galleryElement.innerHTML = ''; // Clear loading message
            nfts.forEach(nft => {
                const item = document.createElement('div');
                item.className = 'nft-item';
                item.innerHTML = `
                    <img src="${nft.image}" alt="${nft.name}" onerror="this.src='https://via.placeholder.com/150'; this.onerror=null;">
                    <h3>${nft.name}</h3>
                `;
                item.addEventListener('click', () => showNftDetail(nft));
                galleryElement.appendChild(item);
            });
        } catch (error) {
            console.error('Error rendering NFTs:', error);
            galleryElement.innerHTML = '<p>Error loading NFTs. Please try refreshing.</p>';
        }
    }

    // --- Modal Logic ---
    const modal = document.getElementById('nft-detail-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.querySelector('.close-modal-button');

    function showNftDetail(nft) {
        modalBody.innerHTML = `
            <img src="${nft.image}" alt="${nft.name}" onerror="this.src='https://via.placeholder.com/150'; this.onerror=null;">
            <h2>${nft.name}</h2>
            <p>${nft.description || 'No description available.'}</p>
            <p><strong>Collection:</strong> ${nft.collection_name || 'N/A'}</p>
            <p><strong>NFT Address:</strong> ${nft.address.slice(0, 6)}...${nft.address.slice(-4)}</p>
        `;
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Initial view
    showView(welcomeView);
});
