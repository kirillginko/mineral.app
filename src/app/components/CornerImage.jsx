import Image from "next/image";
import styles from "../styles/CornerImage.module.css";
const CornerImage = () => {
  return (
    <div className={styles.cornerImage}>
      <Image
        src="https://res.cloudinary.com/dtps5ugbf/image/upload/v1742170167/Microsoft_Word_cyx1cm_a_hflip_a_vflip_qtvsq8.png"
        alt="Corner"
        width={50}
        height={50}
      />
    </div>
  );
};

export default CornerImage;
