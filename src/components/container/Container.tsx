import style from "./Container.module.css";

interface ContainerProps {
    children: React.ReactNode;
}

function Container({ children }: ContainerProps) {
    return (
        <div className={style.container}>
            {children}
        </div>
    );
}

export default Container;
