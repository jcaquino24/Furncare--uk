import { Component } from '@theme/component';

export class DialogOpenEvent extends Event {
  static eventName = 'dialog:open';

  constructor() {
    super(DialogOpenEvent.eventName, { bubbles: true });
  }
}

export class DialogCloseEvent extends Event {
  static eventName = 'dialog:close';

  constructor() {
    super(DialogCloseEvent.eventName, { bubbles: true });
  }
}

export class DialogComponent extends Component {
  requiredRefs = ['dialog'];

  showDialog = () => {
    if (this.refs.dialog?.open) return;
    this.refs.dialog?.showModal();
    this.dispatchEvent(new DialogOpenEvent());
  };

  closeDialog = () => {
    if (!this.refs.dialog?.open) return;
    this.refs.dialog.close();
    this.dispatchEvent(new DialogCloseEvent());
  };

  toggleDialog = () => {
    this.refs.dialog?.open ? this.closeDialog() : this.showDialog();
  };

  closeDialogOnClickOutside = (event) => {
    if (event.target === this.refs.dialog) this.closeDialog();
  };

  closeDialogOnEscapePress = (event) => {
    if (event.key === 'Escape') this.closeDialog();
  };
}

if (!customElements.get('dialog-component')) {
  customElements.define('dialog-component', DialogComponent);
}
