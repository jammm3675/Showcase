document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    // --- DOM Elements ---
    const mainView = document.getElementById('main-view');
    const profileView = document.getElementById('profile-view');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const myNftsContainer = document.getElementById('my-nfts-container');

    // --- TON Connect UI Initialization ---
    const tonConnectUI = new TONConnectUI.TonConnectUI({
        manifestUrl: '/tonconnect-manifest.json',
        buttonRootId: 'ton-connect'
    });

    // --- Event Listeners ---
    searchButton.addEventListener('click', handleSearch);

    // --- State Management ---
    tonConnectUI.onStatusChange(async wallet => {
        if (wallet) {
            await handleWalletConnected(wallet);
        } else {
            handleWalletDisconnected();
        }
    });

    // --- Functions ---
    async function handleWalletConnected(wallet) {
        const userData = tg.initDataUnsafe?.user;
        if (!userData) {
            console.error("Could not retrieve Telegram user data.");
            alert("Error: Could not get Telegram user info. Please open this app through Telegram.");
            return;
        }

        const payload = {
            telegram_id: userData.id,
            wallet_address: wallet.account.address,
            username: userData.username,
            first_name: userData.first_name
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
        }
    }

    function handleWalletDisconnected() {
        myNftsContainer.innerHTML = '';
        console.log('Wallet disconnected.');
    }

    async function handleSearch() {
        const query = searchInput.value;
        if (!query) {
            searchResultsContainer.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/search/users?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            displaySearchResults(data.users);
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
            item.textContent = `${user.first_name} (@${user.username})`;
            item.onclick = () => showProfile(user.telegram_id);
            searchResultsContainer.appendChild(item);
        });
    }

    async function fetchAndDisplayMyNFTs(walletAddress) {
        myNftsContainer.innerHTML = '<h2>Your Collection</h2><div id="nft-gallery">Loading...</div>';
        const gallery = myNftsContainer.querySelector('#nft-gallery');
        await renderNftsToGallery(walletAddress, gallery);
    }

    async function showProfile(telegramId) {
        mainView.style.display = 'none';
        profileView.style.display = 'block';
        profileView.innerHTML = '<p>Loading profile...</p>';

        try {
            const profileRes = await fetch(`/api/profile/${telegramId}`);
            if (!profileRes.ok) throw new Error('Profile not found');
            const profileData = await profileRes.json();

            profileView.innerHTML = `
                <button class="back-button">← Back to Search</button>
                <h1>${profileData.first_name}'s Profile (@${profileData.username})</h1>
                <p>Wallet: ${profileData.wallet_address}</p>
                <a href="https://t.me/${profileData.username}" target="_blank" class="contact-button" style="${profileData.username ? '' : 'display:none;'}">
                    Написать владельцу
                </a>
                <h2>NFT Collection</h2>
                <div id="profile-nft-gallery">Loading NFTs...</div>
            `;

            profileView.querySelector('.back-button').onclick = showMainView;

            const gallery = profileView.querySelector('#profile-nft-gallery');
            await renderNftsToGallery(profileData.wallet_address, gallery);

        } catch (error) {
            console.error('Failed to load profile:', error);
            profileView.innerHTML = `<p>Could not load profile. <button class="back-button">← Back</button></p>`;
            profileView.querySelector('.back-button').onclick = showMainView;
        }
    }

    function showMainView() {
        profileView.style.display = 'none';
        mainView.style.display = 'block';
        searchResultsContainer.innerHTML = ''; // Clear previous search results
        searchInput.value = '';
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
                galleryElement.appendChild(item);
            });
        } catch (error) {
            console.error('Error rendering NFTs:', error);
            galleryElement.innerHTML = '<p>Error loading NFTs.</p>';
        }
    }
});
