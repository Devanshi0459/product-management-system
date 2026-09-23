let products = JSON.parse(localStorage.getItem("products")) || [];

function addProduct() {

    const name = document.getElementById("productName").value;
    const price = document.getElementById("productPrice").value;
    const category = document.getElementById("productCategory").value;
    const image = document.getElementById("productImage").value;

    if (name === "" || price === "" || category === "" || image === "") {
    alert("Please fill all fields");
    return;
}

    const product = {
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        image: image
    };

    products.push(product);
    localStorage.setItem("products", JSON.stringify(products)); 
    displayProducts();

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productCategory").value = "";
    document.getElementById("productImage").value = "";
}


function displayProducts() {

    const productList = document.getElementById("productList");

    productList.innerHTML = "";

    products.forEach(function(product) {

        productList.innerHTML += `
            <div class="product-card">

            <img src="${product.image}" alt="${product.name}">

                <h3>${product.name}</h3>

                <p class="price">
                    ₹${product.price}
                </p>

                <p class="category">
                    ${product.category}
                </p>

                

                <button
                    class="delete-btn"
                    onclick="deleteProduct(${product.id})">
                    Delete
                </button>

            </div>
        `;
    });
}


function deleteProduct(id) {

    products = products.filter(function(product) {
        return product.id !== id;
    });

    localStorage.setItem("products", JSON.stringify(products));

    displayProducts();
}

displayProducts();