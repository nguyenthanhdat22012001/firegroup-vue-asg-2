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
  props: ["propProducts", "propProductsSelected"],
  propProducts: {
    type: Array,
    default: function () {
      return [];
    },
  },
  propProductsSelected: {
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
           <input type="checkbox" @input="onClickSeclectedAll($event)"  class="product-table__checkbox product-table__custom-checkbox" :checked="propProductsSelected.length > 0" />
          </th>
          <th v-show="propProductsSelected.length == 0">Product</th>
          <th v-show="propProductsSelected.length > 0 ">{{propProductsSelected.length}} product selected</th>
          <th>Price</th>
        </tr>
  </thead>

  <tbody>
    <tr v-for="(item, index) in propProducts" :key="item.id">
      <td>
        <input @input="onClickSeclected($event)" type="checkbox" class="product-table__checkbox" :value="item.id" :checked="propProductsSelected.length > 0 && propProductsSelected.includes(item.id)"/>

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
    productsSelected: [],
    // data pagination
    totalProduct: 1,
    currentPage: 1,
    numberPage: 1,
    limit: 10,
    // data search
    filterProduct: {
      isFilter: false,
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
      this.totalProduct = dataLength;
      this.numberPage = Math.ceil(dataLength / this.limit);
    },
    onClickPagingPrev() {
      if (this.currentPage > 1) {
        this.currentPage = this.currentPage - 1;
      }
    },
    onClickPagingNext() {
      if (this.currentPage < this.numberPage) {
        this.currentPage = this.currentPage + 1;
      }
    },
    onFilterProduct(value) {
      let data = [...this.products].filter(
        (item) =>
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          item.id.toLowerCase().includes(value.toLowerCase())
      );

      this.filterProduct = {
        isFilter: true,
        data: data,
      };
      this.currentPage = 1;
      this.updatePage(data);
    },
    onSortProduct(value) {
      if (this.filterProduct.isFilter) {
        this.filterProduct.data = this.handleSortProduct(
          value,
          this.filterProduct.data
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
      this.productsSelected = data;
    },
    onSelectedProducts(data) {
      this.onUpdateProductsSelectedInLocalStorage(data);
    },
    onSelectedProductsAll(isSelectAll) {
      let data = this.products;
      if (this.filterProduct.isFilter) {
        data = this.filterProduct.data;
      }
      let newData = new Array();
      if (isSelectAll) {
        [...data].forEach((item) => {
          newData.push(item.id);
        });
      }
      this.onSetProductsSelectedInLocalStorage(newData);
      this.productsSelected = newData;
    },
  },
  computed: {
    paginationProductComputed: function () {
      let start = (this.currentPage - 1) * this.limit;
      let end = this.currentPage * this.limit;
      let data = new Array();
      if (this.filterProduct.isFilter) {
        data = [...this.filterProduct.data];
      } else {
        data = [...this.products];
      }
      let newData = data.slice(start, end);
      return newData;
    },
  },
  mounted() {
    this.productsSelected = this.onGetProductsSelectedInLocalStorage();
    this.getListProductApi();
  },
});
