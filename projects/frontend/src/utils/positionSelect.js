import showImageCss from './positionSelect.module.css'

export const positionSelect = ({selectEmployee, pdfRef, employee,offsetY}) => {
    const element = selectEmployee.current;
    const imageDimentions = pdfRef.current.getBoundingClientRect();

    const porX = (employee.x / 2000) * 100;
    const porY = (employee.y / 2000) * 100;
    const porHeight = (employee.height / 2000) * 100;
    const porWidth = (employee.width / 2000) * 100;

    const positionX = imageDimentions.width * (porX / 100);
    const positionY = imageDimentions.height * (porY / 100) + offsetY;
    const width = imageDimentions.width * (porWidth / 100);
    const height = imageDimentions.height * (porHeight / 100);


    console.log({
        employee: {
            x: porX,
            y: porY,
            width: porWidth,
            height: porHeight
        },
        imageDimentions,
        result: {
            positionX,
            positionY,
            width,
            height
        }
    })

    element.style.left = `${positionX}px`;
    element.style.top = `${positionY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.classList.remove(showImageCss.selecteEmployeeOpacity);
    element.classList.add(showImageCss.selecteEmployee);
}