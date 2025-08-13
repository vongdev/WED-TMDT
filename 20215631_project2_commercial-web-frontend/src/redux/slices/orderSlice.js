import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    orderItems: [],
    selectedOrderItems: [],
    shippingAddress: {},
    paymentMethod: '',
    itemsPrice: 0,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 0,
    user: '',
    isPaid: false,
    paidAt: '',
    isDelivered: false,
    deliveredAt: '',
};

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addOrderProduct: (state, action) => {
            const { orderItem } = action.payload;
            const itemOrder = state?.orderItems?.find((item) => item?.product === orderItem?.product);
            if (itemOrder) {
                itemOrder.amount += orderItem?.amount;
            } else {
                state.orderItems.push(orderItem);
            }
        },
        increaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            const itemOrder = state?.orderItems?.find((item) => item?.product === idProduct);
            const selectedOrderItems = state?.selectedOrderItems?.find((item) => item?.product === idProduct);
            itemOrder.amount++;
            if (selectedOrderItems) {
                selectedOrderItems.amount++;
            }
        },
        decreaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            const itemOrder = state?.orderItems?.find((item) => item?.product === idProduct);
            const selectedOrderItems = state?.selectedOrderItems?.find((item) => item?.product === idProduct);
            if (itemOrder.amount > 1) itemOrder.amount--;
            if (selectedOrderItems && selectedOrderItems.amount > 1) selectedOrderItems.amount--;
        },
        removeOrderProduct: (state, action) => {
            const { idProduct } = action.payload;
            state.orderItems = state.orderItems.filter((item) => item.product !== idProduct);
            state.selectedOrderItems = state.selectedOrderItems.filter((item) => item.product !== idProduct);
        },
        removeAllOrdersProduct: (state, action) => {
            const { listChecked } = action.payload;
            const remainingItems = state?.orderItems?.filter((item) => !listChecked.includes(item.product));
            // const remainingSelectedItems = state?.selectedOrderItems?.filter((item) => !listChecked.includes(item.product));
            state.orderItems = remainingItems;
            state.selectedOrderItems = remainingItems;
        },
        selectedOrder: (state, action) => {
            const { listChecked } = action.payload;
            const orderSelected = [];
            state.orderItems.forEach((order) => {
                if (listChecked.includes(order.product)) {
                    orderSelected.push(order);
                }
            });
            state.selectedOrderItems = orderSelected;
        },
    },
});

// Action creators are generated for each case reducer function
export const {
    addOrderProduct,
    increaseAmount,
    decreaseAmount,
    removeOrderProduct,
    removeAllOrdersProduct,
    selectedOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
