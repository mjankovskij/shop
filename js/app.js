const products = await(await fetch('../data/prod_data.json')).json();

const sort_products = () => {
    switch (localStorage.getItem('sort_products')) {
        case 'PRICE_DESC':
            products.sort((a, b) => (a.discount ? a.price * 0.9 : a.price) - (b.discount ? b.price * 0.9 : b.price));
            break;
        case 'PRICE_ASC':
            products.sort((a, b) => (b.discount ? b.price * 0.9 : b.price) - (a.discount ? a.price * 0.9 : a.price));
            break;
        case 'COLOR_ASC':
            products.sort((a, b) => a.color.localeCompare(b.color));
            break;
        default:
            products.sort((a, b) => 0.5 - Math.random());
    }
}
sort_products();

function set_sort_products(value) {
    localStorage.setItem('sort_products', value)
}
document.getElementById('sort-products').value = localStorage.getItem('sort_products');
document.getElementById('sort-products').addEventListener('change', () => {
    console.log(document.getElementById('sort-products').value);
    localStorage.setItem('sort_products', document.getElementById('sort-products').value)
    sort_products();
    printProducts();
})

const minPrice = Math.round(products.reduce((p, c) => (p.price < c.price) ? p : c).price);
const maxPrice = Math.ceil(products.reduce((p, c) => (p.price > c.price) ? p : c).price);
let priceSelectedMin = minPrice;
let priceSelectedMax = maxPrice;
let categorySelected;
const bagDOM = document.querySelector('.shopping-bag');

const get_cart_products = () => {
    return JSON.parse(localStorage.getItem('cat_products')) ?? [];
};

const update_cart_products = (id, quantity, rewrite = false) => {
    let products = get_cart_products();
    const productIndex = products.findIndex(p => p.id == id);
    if (productIndex > 0) {
        if(rewrite){
            products[productIndex].qty = quantity;
        }else{
            products[productIndex].qty += quantity;
        }
    } else {
        products.push({ id: id, qty: quantity });
    }

    products = products.filter(p => p.qty > 0);

    localStorage.setItem('cat_products', JSON.stringify(products));
}

const categories = [
    {
        id: 0,
        name: 'Apranga',
    },
    {
        id: 1,
        name: 'Elektronika',
    },
    {
        id: 2,
        name: 'Buities prekės',
    },
    {
        id: 3,
        name: 'Mobilieji telefonai',
    },
    {
        id: 4,
        name: 'Vaikams',
    },
    {
        id: 5,
        name: 'Maistas ir gėrimai',
    }
];

// LOAD categories
categories.forEach(e => {
    document.getElementById('categories').insertAdjacentHTML('afterbegin',
        `<div class="category-single"><p>${e.name}</p></div>`)

})

// add to cart events
const addToCartEvenets = () => {
    document.querySelectorAll('#products button').forEach(e => {
        e.addEventListener('click', () => {
            update_cart_products(e.id, 1);
            printCard();
            bagDOM.classList.add('active');
        });
    });
}

// LOAD PRODUCTS products on page visit or when criterias changed
const printProducts = () => {
    document.getElementById('products').innerHTML = '';

    products
        .filter(o => (o.discount === 1 ? o.price * 0.9 : o.price) > priceSelectedMin && o.price < priceSelectedMax && (!categorySelected || o.category === categorySelected))
        .forEach(p => {
            const priceHtml = p.discount ?
                `<div class="price"><span class="discount">${priceString(p.price)}</span>
            <span>${priceString(p.price * 0.9)}</span></div>`
                : `<div class="price">${priceString(p.price)}</div>`;

            document.getElementById('products').insertAdjacentHTML('afterbegin',
                `<div class="product-single">
        <div class="image">
        <img src="./img/products/${p.id}.jpg" onerror="this.onerror=null;this.src='./img/product_default.jpg';" alt="">
        </div>
        <div class="title">${p.title}</div>
        ${priceHtml}
        <div class="description">${p.description}</div>
        <button id="${p.id}">Į krepšelį</button>
        </div>`)
        })
    addToCartEvenets();
}

printProducts();


//print card/bag
const printCard = () => {
    const inCartCount = get_cart_products().length;
    const totalDOM = document.getElementById('total');
    const cardDOM = document.querySelector('.shopping-bag #products-bag');

    cardDOM.innerHTML = '';

    if (inCartCount > 0) {
        get_cart_products().reverse().forEach(p => {
            const product = products.find(o => o.id == p.id);

            const priceHtml = product.discount ?
                `<div class="price"><span class="discount">${priceString(product.price)}</span>
    <span>${priceString(product.price * 0.9)}</span></div>`
                : `<div class="price">${priceString(product.price)}</div>`;

            cardDOM.insertAdjacentHTML('beforeend', `
    
    <div class="product-single">
        <div class="image">
        <img src="./img/products/${p.id}.jpg" onerror="this.onerror=null;this.src='./img/product_default.jpg';" alt="">
        </div>
        <div class="title">${product.title}</div>
        ${priceHtml}
        <input type="number" class="qty" id="${p.id}" min="1" max="99" value="${p.qty}">

        <div class="close" id=${p.id}><p>x</p></div>
    </div>
    `);
        });
        document.querySelectorAll('#products-bag .close').forEach(e => {
            e.addEventListener('click', () => {
                update_cart_products(e.id, 0, true);
                printCard();
            });
        });

        totalDOM.innerText = inCartCount;
        totalDOM.classList.add('active');
        document.querySelector('.bag .full').classList.add('active');
        document.getElementById('total-price').innerText =
            priceString(get_cart_products().reduce((s, p) => s + (p.discount === 1 ? p.price * 0.9 : p.price), 0));
    } else {
        cardDOM.innerHTML = '<p>Krepšelis tuščias...</p>';
        totalDOM.classList.remove('active');
        document.querySelector('.bag .full').classList.remove('active');
    }
    
    document.querySelectorAll('.bag .product-single .qty').forEach(q => {
        q.addEventListener('change', ()=>{

            update_cart_products(q.id, q.value, true)
        })
    })


};

printCard();

// SEARCH products
const searchDOM = document.getElementById("search-input");
searchDOM.addEventListener('keyup', () => search());

const search = () => {
    document.getElementById('search-results').innerHTML = '';
    if (!searchDOM.value) { return; }
    const searchResults = products.filter(o => o.title.toLowerCase().includes(searchDOM.value.toLowerCase()));
    for (let i = 0; i < (searchResults.length > 5 ? 5 : searchResults.length); i++) {

        const priceHtml = searchResults[i].discount ?
            `<div class="price"><span class="discount">${priceString(searchResults[i].price)}</span>
        <span>${priceString(searchResults[i].price * 0.9)}</span></div>`
            : `<div class="price">${priceString(searchResults[i].price)}</div>`;

        document.getElementById('search-results').insertAdjacentHTML('afterbegin',
            `<div class="product-single">
            <div class="image">
            <img src="./img/products/${searchResults[i].id}.jpg" onerror="this.onerror=null;this.src='./img/product_default.jpg';" alt="">
            </div>
            <div class="title">${searchResults[i].title}</div>
            ${priceHtml}
            </div>`)
    }
    if (searchResults.length < 1) {
        document.getElementById('search-results').innerHTML = '<p>Nieko nerasta.</p>';
    }
}

// display products table, list
document.getElementById('display-th').addEventListener('click', () => {
    document.getElementById('products').classList.remove('list');
});

document.getElementById('display-list').addEventListener('click', () => {
    document.getElementById('products').classList.add('list');
});


// jQuery range price
$('#rangeval').html(priceString(minPrice) + " - " + priceString(maxPrice));
$(function () {
    $('#rangeslider').slider({
        range: true,
        min: minPrice,
        max: maxPrice,
        values: [minPrice, maxPrice],
        slide: function (event, ui) {
            priceSelectedMin = ui.values[0];
            priceSelectedMax = ui.values[1];

            $('#rangeval').html(priceString(ui.values[0]) + " - " + priceString(ui.values[1]));
            printProducts();
        }
    });
});

// select Category
document.querySelectorAll('.category-single').forEach(c => (
    c.addEventListener('click', () => {
        categorySelected = c.innerText;
        printProducts();
    })
));

document.getElementById('show-all-produtcs').addEventListener('click', () => {
    categorySelected = '';
    printProducts();
});

function priceString(price) {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(price);
}


// shopping cart on side show/hide
document.getElementById('display-bag').addEventListener('click', () => {
    bagDOM.classList.add('active');
});

bagDOM.addEventListener('click', ({ target }) => {
    if (target.classList.contains('shopping-bag') || target.classList.contains('close-bag')) {
        bagDOM.classList.remove('active');
    }
});

// 

document.querySelectorAll('.layout-left .options-display').forEach(el => {
    el.querySelector('.arrow').addEventListener('click', () => {
        el.classList.toggle('active')
    })
})