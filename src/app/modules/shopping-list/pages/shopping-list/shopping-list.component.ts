import {Component, Input, signal} from '@angular/core';
import {tap} from 'rxjs';
import {FindByIdShoppingListRes, ProductShoppingList} from '../../../../models/find-by-id-shopping-list-res';
import {ShoppingListsService} from '../../../../services/pages/shopping-lists.service';
import {NavbarShoppingListComponent} from '../../layout/navbar-shopping-list/navbar-shopping-list.component';
import {HeaderShoppingListComponent} from '../../layout/header-shopping-list/header-shopping-list.component';
import {PageComponent} from '../../../../layout/page/page.component';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {ButtonGroupModule} from 'primeng/buttongroup';
import {DialogModule} from 'primeng/dialog';
import {ImageModule} from 'primeng/image';
import {
  ProductShoppingList as ProductUpdateShoppingListReq,
  UpdateShoppingListReq
} from '../../../../models/update-shopping-list-req';
import {DeleteProductsShoppingListReq} from '../../../../models/delete-products-shopping-list-req';
import {SaveShoppingListReq} from '../../../../models/save-shopping-list-req';
import {Router} from '@angular/router';
import {
  TotalsSummaryComponent
} from '@app/modules/shopping-list/layout/shopping-list/totals-summary/totals-summary.component';
import {
  ProductListComponent
} from '@app/modules/shopping-list/layout/shopping-list/product-list/product-list.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    NavbarShoppingListComponent,
    HeaderShoppingListComponent,
    PageComponent,
    CheckboxModule,
    FormsModule,
    ButtonModule,
    ButtonGroupModule,
    DialogModule,
    ImageModule,
    ReactiveFormsModule,
    TotalsSummaryComponent,
    ProductListComponent
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.css'
})
export class ShoppingListComponent {

  private readonly _initShoppingList: FindByIdShoppingListRes = {
    id: 0,
    name: '',
    totalProducts: 0,
    totalPrice: 0,
    totalUnitsPerProducts: 0,
    totalPriceSelectedProducts: 0,
    totalSelectedProducts: 0,
    products: []
  };

  shoppingListRes = signal(this._initShoppingList);

  isNew = signal(false);

  @Input()
  set id(id: number) {
    if (id) {
      this.shoppingListsService.findById(id)
          .pipe(
            tap(shoppingList => this.shoppingListRes.set(shoppingList))
          )
          .subscribe();
    }

    this.isNew.set(!id);
  }

  constructor(
    private shoppingListsService: ShoppingListsService,
    private router: Router
  ) {
  }

  deleteProductEvent(response: ProductShoppingList) {
    const request: DeleteProductsShoppingListReq = {
      productsId: [
        response.product.id
      ]
    };

    this.shoppingListsService.deleteProducts(this.shoppingListRes().id, request)
        .pipe(
          tap(() => this.shoppingListRes.update(value => ({
              ...value,
              products: value.products
                             .filter(product => product.product.id !== response.product.id)
            })
          ))
        )
        .subscribe();
  }

  private updateShoppingList(products: ProductUpdateShoppingListReq[]) {
    const request: UpdateShoppingListReq = {
      name: this.shoppingListRes().name,
      products
    };

    this.shoppingListsService.update(this.shoppingListRes().id, request)
        .subscribe();
  }

  updateProductEvent(productReq: ProductUpdateShoppingListReq) {
    this.shoppingListRes.update(value => {
      const products = value.products
                            .map(product => {
                              if (product.product.id === productReq.productId) {
                                return {
                                  ...product,
                                  selected: productReq.selected!
                                };
                              }

                              return product;
                            });
      const selectedProducts = products.filter(product => product.selected);
      const totalPriceSelectedProducts = selectedProducts
        .map(product => product.totalPrice)
        .reduce((totalPrice, currentPrice) => totalPrice + currentPrice, 0);

      return {
        ...value,
        totalSelectedProducts: selectedProducts.length,
        totalPriceSelectedProducts,
        products
      };
    });

    this.updateShoppingList([productReq]);
  }

  goToAddProductsEvent() {
    if (this.shoppingListRes().id) {
      this.goToAddProducts(this.shoppingListRes().id);

      return;
    }

    const request: SaveShoppingListReq = {
      name: this.shoppingListRes().name
    };

    this.shoppingListsService.save(request)
        .pipe(
          tap(shoppingList => {
            this.goToAddProducts(shoppingList.id);
          })
        )
        .subscribe();
  }

  private goToAddProducts(id: number) {
    this.router.navigate([
      'shopping-list', id, 'add-products'
    ]);
  }

  deleteShoppingListEvent() {
    this.shoppingListsService.delete(this.shoppingListRes().id)
        .pipe(
          tap(() => this.router.navigate(['']))
        )
        .subscribe();
  }

  updateShoppingListEvent($event: FindByIdShoppingListRes) {
    this.shoppingListRes.update(value => ({
        ...value,
        ...$event
      })
    );

    if (this.shoppingListRes().id) {
      this.updateShoppingList([]);

      return;
    }

    const request: SaveShoppingListReq = {
      name: this.shoppingListRes().name
    };

    this.shoppingListsService.save(request)
        .pipe(
          tap(shoppingList => {
            this.router.navigate(['shopping-list', shoppingList.id])
                .then();
          })
        )
        .subscribe();
  }
}
