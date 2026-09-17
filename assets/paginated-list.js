import { Component } from '@theme/component';

export default class PaginatedList extends Component {}

if (!customElements.get('paginated-list')) {
  customElements.define('paginated-list', PaginatedList);
}
