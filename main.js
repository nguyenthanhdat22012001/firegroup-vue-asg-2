Vue.component("InputSearch", {
  props: ["value"],
  value: {
    type: String,
    default: "",
  },
  computed: {
    input_computed: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("emit-input", value);
      },
    },
  },
  template: `<input  v-model="input_computed" class="input__search" type="search" placeholder="Search product by name, tag, id...">`,
});

Vue.component("SelectSort", {
  props: ["value"],
  computed: {
    select_computed: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("emit-select-sort", value);
      },
    },
  },
  template: `<div class="select">
  <label class="select__label">sort:</label>
  <select class="select__sort"  v-model="select_computed">
      <option value="A-Z">Product title A - Z</option>
      <option value="Z-A">Product title Z - A</option>
  </select>
  </div>`,
});

Vue.component("TableProduct", {
  props: ["prop_products", "prop_products_selected"],
  prop_products: {
    type: Array,
    default: function () {
      return [];
    },
  },
  prop_products_selected: {
    type: Array,
    default: function () {
      return [];
    },
  },
  methods: {
    onClickSeclected(event) {
      let data = {
        isChecked: event.target.checked,
        value: event.target.value,
      };
      this.$emit("emit-click-selected-product", data);
    },
    onClickSeclectedAll(event) {
      let isChecked = event.target.checked;
      this.$emit("emit-click-selected-all", isChecked);
    },
  },
  template: ` <div class="product-table">
<table>
  <thead>
      <tr>
          <th>
           <input type="checkbox" @input="onClickSeclectedAll($event)"  class="product-table__checkbox product-table__custom-checkbox" :checked="prop_products_selected.length > 0" />
          </th>
          <th v-show="prop_products_selected.length == 0">Product</th>
          <th v-show="prop_products_selected.length > 0 ">{{prop_products_selected.length}} product selected</th>
          <th>Price</th>
        </tr>
  </thead>

  <tbody>
    <tr v-for="(item, index) in prop_products" :key="item.id">
      <td>
        <input @input="onClickSeclected($event)" type="checkbox" class="product-table__checkbox" :value="item.id" :checked="prop_products_selected.length > 0 && prop_products_selected.includes(item.id)"/>

      </td>
      <td>
          <div class="product-table__item">
              <img class="product-table__img" :src="item.image" :alt="item.name">
              <div class="product-table__content">
                  <p class="product-table__title text-doc-1">{{item.name}}</p>
                  <span class="product-table__id">{{item.id}}</span>
              </div>
          </div>
      </td>
      <td width="90px">
           $ {{item.price}}
      </td>
    </tr>
    
  </tbody>
</table>
</div>`,
});

var vm = new Vue({
  el: "#app",
  emits: ["emit-input", "emit-select-sort", "emit-click-selected-product"],
  data: {
    products: [],
    products_selected: [],
    // data pagination
    total_product: 1,
    current_page: 1,
    number_page: 1,
    limit: 10,
    // data search
    filter_product: {
      is_filter: false,
      data: [],
    },
    // data sort
    sortProduct: "A-Z",
  },
  methods: {
    async fetchApi(url, option) {
      const response = await fetch(url, option);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    },
    async responseApi(res) {
      const data = await res.json();
      return data;
    },
    async getListProductApi() {
      const url = `./assets/data/product.json`;
      let res = await this.fetchApi(url, { methods: "GET" });
      let data = await this.responseApi(res);

      this.products = data;
      this.updatePage(data);
    },
    updatePage(data) {
      let dataLength = [...data].length;
      this.total_product = dataLength;
      this.number_page = Math.ceil(dataLength / this.limit);
    },
    onClickPagingPrev() {
      if (this.current_page > 1) {
        this.current_page = this.current_page - 1;
      }
    },
    onClickPagingNext() {
      if (this.current_page < this.number_page) {
        this.current_page = this.current_page + 1;
      }
    },
    onFilterProduct(value) {
      let data = [...this.products].filter(
        (item) =>
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          item.id.toLowerCase().includes(value.toLowerCase())
      );

      this.filter_product = {
        is_filter: true,
        data: data,
      };
      this.current_page = 1;
      this.updatePage(data);
    },
    onSortProduct(value) {
      if (this.filter_product.is_filter) {
        this.filter_product.data = this.handleSortProduct(
          value,
          this.filter_product.data
        );
      } else {
        this.products = this.handleSortProduct(value, this.products);
      }
    },
    handleSortProduct(key, data) {
      let newData = new Array();
      switch (key) {
        case "Z-A":
          newData = [...data].sort((a, b) => b.name.localeCompare(a.name));

          break;

        default:
          newData = [...data].sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      return newData;
    },
    onSetProductsSelectedInLocalStorage(data) {
      localStorage.setItem("products-selected", JSON.stringify(data));
    },
    onGetProductsSelectedInLocalStorage() {
      let data = localStorage.getItem("products-selected");
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    },
    onUpdateProductsSelectedInLocalStorage(dataSelected) {
      const data = this.onGetProductsSelectedInLocalStorage();
      if (dataSelected.isChecked) {
        data.push(dataSelected.value);
      } else {
        data.splice(data.indexOf(dataSelected.value), 1);
      }

      this.onSetProductsSelectedInLocalStorage(data);
      this.products_selected = data;
    },
    onSelectedProducts(data) {
      this.onUpdateProductsSelectedInLocalStorage(data);
    },
    onSelectedProductsAll(isSelectAll) {
      let data = this.products;
      if (this.filter_product.is_filter) {
        data = this.filter_product.data;
      }
      let newData = new Array();
      if (isSelectAll) {
        [...data].forEach((item) => {
          newData.push(item.id);
        });
      }
      this.onSetProductsSelectedInLocalStorage(newData);
      this.products_selected = newData;
    },
  },
  computed: {
    paginationProductComputed: function () {
      let start = (this.current_page - 1) * this.limit;
      let end = this.current_page * this.limit;
      let data = new Array();
      if (this.filter_product.is_filter) {
        data = [...this.filter_product.data];
      } else {
        data = [...this.products];
      }
      let newData = data.slice(start, end);
      return newData;
    },
  },
  mounted() {
    this.products_selected = this.onGetProductsSelectedInLocalStorage();
    this.getListProductApi();
  },
});
