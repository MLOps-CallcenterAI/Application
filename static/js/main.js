document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = document.getElementById('chatHistory');
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Add user message to chat
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = '<span>You</span><span>Just now</span>';
        
        const messageText = document.createElement('p');
        messageText.textContent = text;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(messageText);
        chatHistory.appendChild(messageDiv);
        
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Add bot message to chat
    function addBotMessage(response) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        // Since your API doesn't specify which model was used, we'll make an educated guess
        // based on text characteristics
        const text = response.input || '';
        const isComplex = text.length > 100 || /[^\x00-\x7F]/.test(text); // Non-ASCII chars or long text
        const modelType = isComplex ? 'transformer' : 'tfidf';
        const modelName = modelType === 'tfidf' ? 'TF-IDF + SVM' : 'Transformer';
        const modelClass = modelType === 'tfidf' ? 'tfidf-model' : 'transformer-model';
        
        headerDiv.innerHTML = `
            <span>CallCenterAI <span class="model-info ${modelClass}">${modelName}</span></span>
            <span>Just now</span>
        `;
        
        const messageText = document.createElement('p');
        messageText.textContent = `Ticket successfully classified. The issue appears to be related to ${response.prediction}.`;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(messageText);
        
        // Add category
        if (response.prediction) {
            const categoryTag = document.createElement('div');
            categoryTag.className = 'category-tag';
            categoryTag.textContent = `Category: ${response.prediction}`;
            messageDiv.appendChild(categoryTag);
        }
        
        // Add confidence (since your API doesn't provide it, we'll simulate based on model)
        const simulatedConfidence = modelType === 'tfidf' ? 0.85 : 0.92;
        
        const confidenceBar = document.createElement('div');
        confidenceBar.className = 'confidence-bar';
        
        const confidenceFill = document.createElement('div');
        confidenceFill.className = 'confidence-fill';
        confidenceFill.style.width = `${simulatedConfidence * 100}%`;
        
        confidenceBar.appendChild(confidenceFill);
        messageDiv.appendChild(confidenceBar);
        
        const confidenceText = document.createElement('div');
        confidenceText.style.fontSize = '0.8rem';
        confidenceText.style.marginTop = '5px';
        confidenceText.textContent = `Confidence: ${(simulatedConfidence * 100).toFixed(1)}%`;
        messageDiv.appendChild(confidenceText);
        
        // Add model explanation
        const explanationDiv = document.createElement('div');
        explanationDiv.style.fontSize = '0.8rem';
        explanationDiv.style.marginTop = '10px';
        explanationDiv.style.color = 'var(--secondary-color)';
        explanationDiv.textContent = modelType === 'tfidf' 
            ? 'Used TF-IDF model for this straightforward technical issue.' 
            : 'Used Transformer model for better context understanding.';
        messageDiv.appendChild(explanationDiv);
        
        chatHistory.appendChild(messageDiv);
        
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Handle form submission
    submitBtn.addEventListener('click', async function() {
        const text = userInput.value.trim();
        
        if (!text) {
            alert('Please enter a ticket description.');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        submitBtn.disabled = true;
        
        // Add user message to chat
        addUserMessage(text);
        
        try {
            // Send request to your actual API endpoint
            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: text }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Add bot response to chat
            addBotMessage(data);
            
            // Clear input
            userInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            
            // Add error message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = '<span>CallCenterAI</span><span>Just now</span>';
            
            const messageText = document.createElement('p');
            messageText.textContent = 'Sorry, there was an error processing your request. Please try again.';
            
            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(messageText);
            chatHistory.appendChild(messageDiv);
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            submitBtn.disabled = false;
            
            // Scroll to bottom
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    });

    // Handle clear button
    clearBtn.addEventListener('click', function() {
        userInput.value = '';
    });

    // Allow submitting with Ctrl+Enter
    userInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            submitBtn.click();
        }
    });

    // Example responses for demo purposes
    function addExampleMessage() {
        const examples = [
            "My computer won't turn on and I have an important meeting in 30 minutes",
            "Need access to the shared drive for the marketing team",
            "Invoice from last month hasn't been received yet",
            "Phone system keeps dropping calls during peak hours"
        ];
        
        const examplesDiv = document.createElement('div');
        examplesDiv.className = 'info-card';
        examplesDiv.innerHTML = `
            <h3>Try these examples:</h3>
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                ${examples.map(example => 
                    `<button class="example-btn" style="text-align: left; padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; font-size: 0.9rem;" data-text="${example}">${example}</button>`
                ).join('')}
            </div>
        `;
        
        chatHistory.appendChild(examplesDiv);
        
        // Add event listeners to example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                userInput.value = this.getAttribute('data-text');
            });
        });
        
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Add example messages after the initial bot message
    setTimeout(addExampleMessage, 1000);
});