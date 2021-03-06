document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    /*--------form---------*/
    /*получаем элементы*/
    const customer = document.getElementById('customer');
    const freelancer = document.getElementById('freelancer');

    const blockCustomer = document.getElementById('block-customer');
    const blockFreelancer = document.getElementById('block-freelancer');

    const blockChoice = document.getElementById('block-choice');
    const btnExit = document.getElementById('btn-exit');

    const formCustomer = document.getElementById('form-customer');
    //таблица
    const ordersTable = document.getElementById('orders');
    //модальное окно
    const modalOrder = document.getElementById('order_read');
    const modalOrderActive = document.getElementById('order_active');

    const headTable = document.getElementById('headTable')
    /*создаем заказы*/
    const orders = JSON.parse(localStorage.getItem('freeOrders')) || [];

    const toStorage = () => {
        localStorage.setItem('freeOrders', JSON.stringify(orders));
    };


    /*ф-ция склонения числительных*/
    const declOfNum = (number, titles) =>
        number + ' ' + titles[(number % 100 > 4 && number % 100 < 20) ?
        2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]];
    /*считает дату дедлайна*/
    const calcDeadline = (date) => {
        const deadline = new Date(date);
        const toDay = Date.now();

        const remaining = (deadline - toDay) / 1000 / 60 / 60;

        if (remaining / 24 > 2) {
            return declOfNum(Math.floor(remaining / 24), ['день', 'дня', 'дней']);
        }
        return declOfNum(Math.floor(remaining), ['час', 'часа', 'часов']);
    };

    //рендерим таблицу заказов
    const renderOrder = () => {

        ordersTable.textContent = '';

        orders.forEach((order, i) => {
            //шаблонные строки
            ordersTable.innerHTML += `
            <!--номер заказа-->
            <tr class="order ${order.active ? 'taken' : ''}"
                data-number-order="${i}"> 
                <td>${i + 1}</td>
                <td>${order.title}</td>
                <td class="${order.currency}"></td>
                <td>${calcDeadline(order.deadline)}</td>
            </tr>`
        });
    };

    const handlerModal = (event) => {
        const target = event.target;
        const modal = target.closest('.order-modal');
        const order = orders[modal.id];

        const baseAction = () => {
            modal.style.display = 'none';
            toStorage();
            renderOrder();
        }

        if (target.closest('.close') || target === modal) {
            modal.style.display = 'none';
        }

        if (target.classList.contains('get-order')) {
            order.active = true;
            baseAction();

        }

        if (target.id === 'capitulation') {
            order.active = false;
            baseAction();
        }

        if (target.id === 'ready') {
            orders.splice(orders.indexOf(order), 1);
            baseAction();
        }
    };

    /*модальное окно*/
    const openModal = (numberOrder) => {
        const order = orders[numberOrder];
        //console.log(order);

        const {title, firstName, email, phone, description, amount, currency, deadline, active = false} = order;

        const modal = active ? modalOrderActive : modalOrder;

        const firstNameBlock = modal.querySelector('.firstName');
        const titleBlock = modal.querySelector('.modal-title');
        const emailBlock = modal.querySelector('.email');
        const descriptionBlock = modal.querySelector('.description');
        const deadlineBlock = modal.querySelector('.deadline');
        const currencyBlock = modal.querySelector('.currency_img');
        const countBlock = modal.querySelector('.count');
        const phoneBlock = modal.querySelector('.phone');

        modal.id = numberOrder;
        titleBlock.textContent = title;
        firstNameBlock.textContent = firstName;
        emailBlock.textContent = email;
        emailBlock.href = 'mailto:' + email;
        descriptionBlock.textContent = description;
        deadlineBlock.textContent = calcDeadline(deadline);
        currencyBlock.className = 'currency_img';
        currencyBlock.classList.add(currency);
        countBlock.textContent = amount;

        phoneBlock ? phoneBlock.href = `tel: + ${phone}` : '';


        modal.style.display = 'flex';

        modal.addEventListener('click', handlerModal)

    };

    /*сортировка объекта в массиве*/
    const sortOrder = (arr, property) => {
        arr.sort((a, b) => a[property] > b[property] ? 1 : -1)
    };

    /*сортировка таблицы заказов*/
    headTable.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('head-sort')) {
            if (target.id === 'taskSort') {
                sortOrder(orders, 'title');
            }
            if (target.id === 'currencySort') {
                sortOrder(orders, 'currency');
            }
            if (target.id === 'deadlineSort') {
                sortOrder(orders, 'deadline');
            }
            toStorage();
            renderOrder();
        }
    })

    /*обработчик событий таблицы*/
    ordersTable.addEventListener('click', (event) => {
        //на что кликнул то и получил в верстке
        const target = event.target;
        //получаю всю строку заказа
        const targetOrder = target.closest('.order');

        if (targetOrder) {
            openModal(targetOrder.dataset.numberOrder);
        }

        //получает data атрибут
        //console.log(orders[targetOrder.dataset.numberOrder]);
    });

    /*обработчик событий кн Заказчик*/
    customer.addEventListener('click', () => {
        blockChoice.style.display = 'none';
        const toDay = new Date().toISOString().substring(0, 10);
        document.getElementById('deadline').min = toDay;
        blockCustomer.style.display = 'block';
        btnExit.style.display = 'block';
    });

    /*обработчик событий кн Фрилансер*/
    freelancer.addEventListener('click', () => {
        blockChoice.style.display = 'none';
        renderOrder();
        blockFreelancer.style.display = 'block';
        btnExit.style.display = 'block';
    });

    /*обработчик событий кн Выход*/
    btnExit.addEventListener('click', () => {
        btnExit.style.display = 'none';
        blockCustomer.style.display = 'none';
        blockFreelancer.style.display = 'none';
        blockChoice.style.display = 'block';

    });

    /*Перебор эл формы, отправка заказа*/
    formCustomer.addEventListener('submit', (event) => {
        event.preventDefault();

        /*Вариант с методами filter и forEach*/

        const obj = {};

        const elements = [...formCustomer.elements]
            .filter((elem) =>
                (elem.tagName === 'INPUT' && elem.type !== 'radio') ||
                (elem.type === 'radio' && elem.checked) ||
                elem.tagName === 'TEXTAREA');

        elements.forEach((elem) => {
            obj[elem.name] = elem.value;

            if (elem.type !== 'radio') {
                elem.value = '';
            }
        });
        /*добавляем форму в заказы*/
        orders.push(obj);
        /*сброс формы*/
        formCustomer.reset();

        toStorege()
    })


});