// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api'; // Keep for local testing

    const adminKeyInput = document.getElementById('adminKeyInput');
    const submitAdminKeyButton = document.getElementById('submitAdminKey');
    const adminKeyPrompt = document.getElementById('admin-key-prompt');
    const adminMessage = document.getElementById('adminMessage');
    // Renamed from pendingBusinessesList to reflect it now shows all businesses for admin
    const allBusinessesList = document.getElementById('pending-businesses-list'); // Re-using existing HTML ID

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navMenu = document.getElementById('nav-menu');

    const LOCAL_ADMIN_KEY = 'supersecretadminkey'; // Must match ADMIN_KEY in server.js and .env

    // Renamed function: now fetches all businesses for admin to manage
    const fetchAllBusinessesForAdmin = async (enteredAdminKey) => {
        try {
            adminMessage.textContent = 'Loading businesses...';
            adminMessage.classList.remove('text-red-500'); // Clear any previous error color

            // <-- CHANGE: Removed ?status=pending to fetch all businesses for admin
            const response = await fetch(`${API_BASE_URL}/businesses`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': enteredAdminKey // Send admin key in header
                }
            });

            const data = await response.json(); // Always try to parse JSON for messages

            if (!response.ok) {
                if (response.status === 403) {
                    adminMessage.textContent = data.message || 'Unauthorized: Invalid admin key.';
                    adminMessage.classList.add('text-red-500');
                    adminKeyPrompt.classList.remove('hidden'); // Show prompt again
                    allBusinessesList.classList.add('hidden');
                    return;
                }
                throw new Error(data.message || 'Failed to fetch businesses for admin.');
            }
            
            renderAdminBusinesses(data, enteredAdminKey); // Pass key for deletion calls
            adminMessage.textContent = ''; // Clear message on success
            adminKeyPrompt.classList.add('hidden'); // Hide prompt on success
            allBusinessesList.classList.remove('hidden'); // Show list

        } catch (error) {
            console.error('Error fetching businesses for admin:', error);
            adminMessage.textContent = 'Error loading businesses. Please try again.';
            adminMessage.classList.add('text-red-500');
            adminKeyPrompt.classList.remove('hidden');
            allBusinessesList.classList.add('hidden');
        }
    };

    // Renamed function: now renders all businesses for admin
    const renderAdminBusinesses = (businesses, adminKey) => {
        allBusinessesList.innerHTML = ''; // Clear previous list
        if (businesses.length === 0) {
            allBusinessesList.innerHTML = '<p class="text-gray-600">No businesses found in the directory.</p>';
            return;
        }

        businesses.forEach(business => {
            const businessCard = `
                <div class="bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h3 class="text-lg font-semibold">${business.name}</h3>
                        <p class="text-sm text-gray-700">Category: ${business.category}</p>
                        <p class="text-sm text-gray-700">Location: ${business.location}</p>
                        <p class="text-sm text-gray-500">Status: ${business.approved ? 'Approved' : 'Pending/Unapproved'}</p>
                        <p class="text-sm text-gray-500">Description: ${business.description ? business.description.substring(0, 80) : ''}...</p>
                    </div>
                    <div class="flex space-x-2 mt-3 sm:mt-0">
                        <button data-id="${business.id}" class="delete-button bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Delete</button>
                    </div>
                </div>
            `;
            allBusinessesList.insertAdjacentHTML('beforeend', businessCard);
        });

        // Add event listeners to the delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const businessId = event.target.dataset.id;
                if (confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
                    await deleteBusiness(businessId, adminKey);
                }
            });
        });
    };

    // approveBusiness function is now obsolete and removed

    // Function to handle business deletion (unchanged, still needed)
    const deleteBusiness = async (businessId, adminKey) => {
        try {
            const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminKey }), // Send admin key for verification
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || `Business "${businessId}" deleted successfully.`);
                fetchAllBusinessesForAdmin(adminKey); // Re-fetch list to update
            } else {
                alert(data.message || 'Failed to delete business.');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            alert('An error occurred while deleting the business.');
        }
    };


    // Event listener for admin key submission
    submitAdminKeyButton.addEventListener('click', () => {
        const enteredKey = adminKeyInput.value.trim();
        // Console logs for debugging (keep these for your testing!)
        console.log('Entered Key:', enteredKey);
        console.log('Local Admin Key (Expected):', LOCAL_ADMIN_KEY);
        console.log('Keys Match:', enteredKey === LOCAL_ADMIN_KEY);

        if (enteredKey === LOCAL_ADMIN_KEY) {
            fetchAllBusinessesForAdmin(enteredKey); // <-- CHANGE: Call the new function
        } else {
            adminMessage.textContent = 'Invalid Admin Key.';
            adminMessage.classList.add('text-red-500');
        }
    });

    // Mobile Menu Toggle (common for all pages)
    mobileMenuButton.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
    });

    // Initial behavior: Key prompt is visible, list is hidden
});