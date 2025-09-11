import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ProductInterface } from '@/model/product';
import { PEN_Formatter } from '@/utils/utils';

interface CardProductProps {
    product: ProductInterface;
}

export function CardProduct({ product }: CardProductProps) {
    return (
        <Card key={product.sku_id} className="mb-4">
            <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.brand_name}</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Precio: {PEN_Formatter.format(product.price)}</p>
                <p>Color: {product.color}</p>
                <p>Talla: {product.size}</p>
            </CardContent>
        </Card>
    );
}