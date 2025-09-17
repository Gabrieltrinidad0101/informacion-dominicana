import { useEffect, useRef } from 'react';
import showImageCss from './ShowImage.module.css'
import { positionSelect } from '../../utils/positionSelect';
let lastUrl = ""

const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export function ShowImage({ employee, institution, currentDate }) {
    const selectEmployee = useRef(null);
    const imageRef = useRef(null);
    const monthName = monthNames[currentDate?.getMonth() ?? ""];
    const url = `http://localhost:5500/data/${institution}/nomina/postDownloads/${currentDate.getFullYear()}/${monthName}/_.${employee.index}.jpg`;

    useEffect(() => {
        if (lastUrl !== "") selectEmployee.current.classList.add(positionSelect.selecteEmployeeOpacity);
        lastUrl = url
    }, [url])

    const handleSelectPosition = () => {
        positionSelect(selectEmployee, imageRef, employee)
    }

    useEffect(() => {
        const load = setInterval(() => {
            const image = imageRef.current
            if (!image?.complete) return
            clearInterval(load)
            handleSelectPosition()
        }, 500);
    }, [employee])

    useEffect(() => {
        window.addEventListener("resize", handleSelectPosition)
        return () => {
            window.removeEventListener("resize", handleSelectPosition)
        }
    }, [])



    return (
        <>
            <div className={showImageCss.overflowImage}>
                <img ref={imageRef} className={showImageCss.image} src={url} width="90%" height="90%" style={{
                    transform: `rotate(-${employee?.pageAngle ?? 0}deg)`,
                }} />
            </div>

            <div className={positionSelect.selecteEmployee} ref={selectEmployee}></div>
        </>
    )
}
